import mongoose from 'mongoose';
import { AgentRepository } from '../repositories/agent.repository.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { TaskLogRepository } from '../repositories/task-log.repository.js';
import { getToolQueue } from '../queues/tool.queue.js';
import { LlmService } from './llm.service.js';
import { getSocketServer } from '../sockets/socket.server.js';
import { SOCKET_EVENTS } from '../events/socket-events.js';
import { env } from '../config/env.js';
import { ToolService } from './tool.service.js';
import type { TaskAttachment, TaskTokenUsage } from '../types/task.types.js';

const AGENT_FLOW = ['PlannerAgent', 'ResearchAgent', 'AnalysisAgent', 'WriterAgent'] as const;

function buildAttachmentContext(attachment?: TaskAttachment): string {
  if (!attachment) {
    return 'No file attachment was provided.';
  }

  return [
    'Attached file context:',
    `- Name: ${attachment.fileName}`,
    `- MIME type: ${attachment.mimeType}`,
    `- Kind: ${attachment.kind}`,
    `- Size in bytes: ${attachment.size}`,
    `- Content truncated: ${attachment.truncated ? 'yes' : 'no'}`,
    'Attached file content:',
    '<file_content>',
    attachment.content,
    '</file_content>',
  ].join('\n');
}

function buildAgentPrompt(agentName: (typeof AGENT_FLOW)[number], input: string, attachment?: TaskAttachment): string {
  const sharedContext = [
    `User question: ${input}`,
    buildAttachmentContext(attachment),
    'When a file is attached, ground the answer in that file before using general knowledge.',
    'If the file is code, explain structure, purpose, notable functions, and important logic paths.',
    'If the file is CSV or tabular data and the user asks for prediction or decision support, infer likely features and patterns from the data, provide a best-effort prediction, and clearly state uncertainty when the data is insufficient for a definitive answer.',
    'If the file is a PDF, treat the extracted text as the document content and answer questions about it directly (summarize, explain, extract information, answer questions based on the text).',
  ].join('\n\n');

  switch (agentName) {
    case 'PlannerAgent':
      return `${sharedContext}\n\nCreate a short execution plan for answering the question.`;
    case 'ResearchAgent':
      return `${sharedContext}\n\nExtract the most relevant facts, structures, and evidence needed to answer the question.`;
    case 'AnalysisAgent':
      return `${sharedContext}\n\nAnalyze the evidence and derive the most useful answer for the user.`;
    case 'WriterAgent':
      return `${sharedContext}\n\nDraft the final answer in a clear, concise format suitable for the user.`;
  }
}

function buildFinalPrompt(input: string, attachment?: TaskAttachment): string {
  return [
    `User question: ${input}`,
    buildAttachmentContext(attachment),
    'Write the final answer for the user.',
    'Requirements:',
    '- Use the attached file as the primary source when present.',
    '- For code files, explain what the code does, how it is structured, and any important implementation details.',
    '- For CSV or structured data files, identify likely features, summarize relevant patterns, and provide a best-effort prediction or decision guidance based on the available data.',
    '- For PDF files, answer based on the extracted text content of the document.',
    '- If a PDF appears to contain no text (image-only scan), say so clearly.',
    '- Do not claim certainty if the file does not support certainty.',
    '- Keep the response practical and directly answer the question.',
  ].join('\n');
}

export class AgentService {
  constructor(
    private readonly agentRepository = new AgentRepository(),
    private readonly taskRepository = new TaskRepository(),
    private readonly taskLogRepository = new TaskLogRepository(),
    private readonly llmService = new LlmService(),
    private readonly toolService = new ToolService(),
  ) {}

  async executeTask(taskId: string): Promise<void> {
    const io = getSocketServer();
    const task = await this.taskRepository.findByIdWithAttachment(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    const input = task.input;
    const attachment = task.attachment;
    const accumulated: TaskTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    await this.taskRepository.updateStatus(taskId, 'running');

    io.to(taskId).emit(SOCKET_EVENTS.TASK_STARTED, { taskId });

    for (const agentName of AGENT_FLOW) {
      const agent = await this.agentRepository.create({
        taskId: new mongoose.Types.ObjectId(taskId),
        name: agentName,
        status: 'running',
        output: '',
      });

      io.to(taskId).emit(SOCKET_EVENTS.AGENT_STEP, {
        taskId,
        agentName,
        status: 'running',
      });

      await this.taskLogRepository.create({
        taskId: new mongoose.Types.ObjectId(taskId),
        event: 'agent_step',
        payload: { agentName, status: 'running' },
      });

      if (agentName === 'ResearchAgent' && !attachment) {
        const toolQueue = getToolQueue();

        if (toolQueue) {
          await toolQueue.add('tool.execute', {
            taskId,
            toolName: 'WebSearchTool',
            query: input,
            toolRecordId: '',
          });
        } else {
          const toolResult = await this.toolService.execute({
            taskId,
            toolName: 'WebSearchTool',
            query: input,
          });

          io.to(taskId).emit(SOCKET_EVENTS.TOOL_EXECUTED, {
            taskId,
            toolName: 'WebSearchTool',
            status: 'completed',
            result: toolResult,
          });
        }
      }

      const agentResult = await this.llmService.generateCompletion({
        provider: env.LLM_PROVIDER,
        prompt: buildAgentPrompt(agentName, input, attachment),
      });

      accumulated.promptTokens += agentResult.tokenUsage.promptTokens;
      accumulated.completionTokens += agentResult.tokenUsage.completionTokens;
      accumulated.totalTokens += agentResult.tokenUsage.totalTokens;

      await this.agentRepository.updateStatus(agent.id, 'completed', agentResult.text);

      io.to(taskId).emit(SOCKET_EVENTS.AGENT_STEP, {
        taskId,
        agentName,
        status: 'completed',
      });
    }

    const finalResult = await this.llmService.generateCompletion({
      provider: env.LLM_PROVIDER,
      prompt: buildFinalPrompt(input, attachment),
    });

    accumulated.promptTokens += finalResult.tokenUsage.promptTokens;
    accumulated.completionTokens += finalResult.tokenUsage.completionTokens;
    accumulated.totalTokens += finalResult.tokenUsage.totalTokens;

    await this.taskRepository.updateStatus(taskId, 'completed', {
      result: finalResult.text,
      tokenUsage: accumulated,
    });

    await this.taskLogRepository.create({
      taskId: new mongoose.Types.ObjectId(taskId),
      event: 'task_completed',
      payload: { result: finalResult.text, tokenUsage: accumulated },
    });

    io.to(taskId).emit(SOCKET_EVENTS.TASK_COMPLETED, {
      taskId,
      result: finalResult.text,
      tokenUsage: accumulated,
    });
  }

  async failTask(taskId: string, errorMessage: string): Promise<void> {
    await this.taskRepository.updateStatus(taskId, 'failed', { error: errorMessage });

    await this.taskLogRepository.create({
      taskId: new mongoose.Types.ObjectId(taskId),
      event: 'task_failed',
      payload: { error: errorMessage },
    });

    const io = getSocketServer();
    io.to(taskId).emit(SOCKET_EVENTS.TASK_FAILED, { taskId, error: errorMessage });
  }
}
