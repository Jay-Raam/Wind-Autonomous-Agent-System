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

const AGENT_FLOW = ['PlannerAgent', 'ResearchAgent', 'AnalysisAgent', 'WriterAgent'] as const;

export class AgentService {
  constructor(
    private readonly agentRepository = new AgentRepository(),
    private readonly taskRepository = new TaskRepository(),
    private readonly taskLogRepository = new TaskLogRepository(),
    private readonly llmService = new LlmService(),
    private readonly toolService = new ToolService(),
  ) {}

  async executeTask(taskId: string, input: string): Promise<void> {
    const io = getSocketServer();

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

      if (agentName === 'ResearchAgent') {
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

      const output = await this.llmService.generateCompletion({
        provider: env.LLM_PROVIDER,
        prompt: `${agentName} handling task: ${input}`,
      });

      await this.agentRepository.updateStatus(agent.id, 'completed', output);

      io.to(taskId).emit(SOCKET_EVENTS.AGENT_STEP, {
        taskId,
        agentName,
        status: 'completed',
      });
    }

    const finalResult = await this.llmService.generateCompletion({
      provider: env.LLM_PROVIDER,
      prompt: `Generate a concise final result for task: ${input}`,
    });

    await this.taskRepository.updateStatus(taskId, 'completed', { result: finalResult });

    await this.taskLogRepository.create({
      taskId: new mongoose.Types.ObjectId(taskId),
      event: 'task_completed',
      payload: { result: finalResult },
    });

    io.to(taskId).emit(SOCKET_EVENTS.TASK_COMPLETED, {
      taskId,
      result: finalResult,
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
