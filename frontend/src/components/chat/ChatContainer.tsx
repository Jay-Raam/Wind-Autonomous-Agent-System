import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useAgentStore } from '../../store/agentStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AgentActivityPanel } from '../agents/AgentActivityPanel';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '../../store/uiStore';
import { Activity, Sparkles, Settings2, Share2, MoreHorizontal, Bot, PanelRightClose, PanelRightOpen, PanelLeftOpen } from 'lucide-react';
import { SettingsPanel } from '../SettingsPanel';
import { Button } from '../ui/Button';
import { cn } from '../../utils/helpers';
import {
  createTask,
  getEntityId,
  getTaskById,
  listAgentsByTask,
  listTasks,
  listToolsByTask,
  ApiError,
} from '../../utils/api';
import type { ChatInputPayload } from './ChatInput';
import { AgentRole, AgentStep, ChatSession, Message, TaskPlanStep, TaskStatus, ToolExecution } from '../../types';
import { useAuthStore } from '../../store/authStore';

const AGENT_ORDER = ['PlannerAgent', 'ResearchAgent', 'AnalysisAgent', 'WriterAgent'] as const;

function toTimestamp(value: string): number {
  return new Date(value).getTime();
}

function toAgentRole(name: string): AgentRole {
  switch (name) {
    case 'PlannerAgent':
      return 'planner';
    case 'ResearchAgent':
      return 'researcher';
    case 'AnalysisAgent':
      return 'analyzer';
    case 'WriterAgent':
      return 'writer';
    default:
      return 'executor';
  }
}

function buildPlan(statusByAgent: Map<string, TaskStatus>): TaskPlanStep[] {
  const labels: Record<(typeof AGENT_ORDER)[number], string> = {
    PlannerAgent: 'Plan execution strategy',
    ResearchAgent: 'Collect supporting information',
    AnalysisAgent: 'Analyze and synthesize findings',
    WriterAgent: 'Generate final response',
  };

  let previousDone = true;

  return AGENT_ORDER.map((agentName, index) => {
    const status = statusByAgent.get(agentName);
    let stepStatus: TaskPlanStep['status'] = 'todo';

    if (status === 'completed') {
      stepStatus = 'done';
    } else if (status === 'running') {
      stepStatus = 'in-progress';
    } else if (previousDone) {
      stepStatus = 'in-progress';
    }

    previousDone = status === 'completed';

    return {
      id: `plan-${index + 1}`,
      title: labels[agentName],
      description: '',
      status: stepStatus,
    };
  });
}

function mapTaskToSession(task: {
  id?: string;
  _id?: string;
  input: string;
  status: TaskStatus;
  attachment?: Message['attachment'];
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  tokenUsage?: Message['tokenUsage'];
}): ChatSession {
  const taskId = getEntityId(task);
  const createdAt = toTimestamp(task.createdAt);
  const updatedAt = toTimestamp(task.updatedAt);

  const messages: Message[] = [
    {
      id: `${taskId}-user`,
      role: 'user' as const,
      content: task.input,
      timestamp: createdAt,
      attachment: task.attachment,
    },
  ];

  if (task.status === 'completed' && task.result) {
    messages.push({
      id: `${taskId}-assistant`,
      role: 'assistant',
      content: task.result,
      timestamp: updatedAt,
      tokenUsage: task.tokenUsage,
    });
  }

  if (task.status === 'failed') {
    messages.push({
      id: `${taskId}-assistant`,
      role: 'assistant',
      content: `Task failed: ${task.error ?? 'Unknown error'}`,
      timestamp: updatedAt,
    });
  }

  return {
    id: taskId,
    taskId,
    taskStatus: task.status,
    title: task.input.slice(0, 60),
    messages,
    createdAt,
  };
}

export const ChatContainer: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const {
    sessions,
    currentSessionId,
    addMessage,
    createNewSession,
    setCurrentSession,
    setSessions,
    updateSession,
    isStreaming,
    setStreaming,
  } = useChatStore();
  const { setSteps, setToolExecutions, setPlan, setGoal, clearActivity } = useAgentStore();
  const { isRightPanelOpen, toggleRightPanel, setRightPanel, syncViewport, isSidebarOpen, toggleSidebar } = useUIStore();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    syncViewport(window.innerWidth);

    const handleResize = () => {
      syncViewport(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [syncViewport]);

  const forceLogin = React.useCallback(() => {
    void logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      try {
        const tasks = await listTasks();
        if (cancelled) {
          return;
        }

        const mapped = tasks.map(mapTaskToSession);
        setSessions(mapped);

        const firstRunning = mapped.find((session) =>
          session.taskStatus === 'pending' || session.taskStatus === 'running',
        );

        if (firstRunning) {
          setCurrentSession(firstRunning.id);
        }
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          forceLogin();
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load tasks';
        const sessionId = createNewSession();
        addMessage(sessionId, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `API setup failed: ${message}`,
          timestamp: Date.now(),
        });
      }
    };

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [addMessage, createNewSession, forceLogin, setCurrentSession, setSessions]);

  const syncTaskActivity = React.useCallback(
    async (sessionId: string, taskId: string) => {
      const [detail, agents, tools] = await Promise.all([
        getTaskById(taskId),
        listAgentsByTask(taskId),
        listToolsByTask(taskId),
      ]);

      const task = detail.task;
      const status = task.status;
      const statusByAgent = new Map<string, TaskStatus>();

      const steps: AgentStep[] = [...agents]
        .sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt))
        .map((agent) => {
          statusByAgent.set(agent.name, agent.status);
          const stateLabel = agent.status[0].toUpperCase() + agent.status.slice(1);

          return {
            id: getEntityId(agent),
            agentName: agent.name,
            role: toAgentRole(agent.name),
            status: agent.status,
            message: agent.output || `${stateLabel} update from ${agent.name}`,
            timestamp: toTimestamp(agent.updatedAt),
          };
        });

      const toolExecutions: ToolExecution[] = tools.map((tool) => ({
        id: getEntityId(tool),
        toolName: tool.name,
        query: tool.query,
        result: tool.result,
        status: tool.status,
      }));

      setSteps(steps);
      setToolExecutions(toolExecutions);
      setPlan(buildPlan(statusByAgent));
      setGoal(task.input);

      updateSession(sessionId, {
        taskStatus: status,
      });

      if (status === 'completed' || status === 'failed') {
        const state = useChatStore.getState();
        const session = state.sessions.find((item) => item.id === sessionId);
        if (!session) {
          return status;
        }

        const assistantMessageId = `${taskId}-assistant`;
        const assistantContent =
          status === 'completed' ? task.result ?? 'Task completed.' : `Task failed: ${task.error ?? 'Unknown error'}`;

        const withoutAssistant = session.messages.filter((message) => message.id !== assistantMessageId);

        updateSession(sessionId, {
          messages: [
            ...withoutAssistant,
            {
              id: assistantMessageId,
              role: 'assistant',
              content: assistantContent,
              timestamp: Date.now(),
              tokenUsage: status === 'completed' ? task.tokenUsage : undefined,
            },
          ],
        });
      }

      return status;
    },
    [setGoal, setPlan, setSteps, setToolExecutions, updateSession],
  );

  useEffect(() => {
    if (!currentSession?.taskId) {
      clearActivity();
      setStreaming(false);
      return;
    }

    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const poll = async () => {
      try {
        const status = await syncTaskActivity(currentSession.id, currentSession.taskId!);
        if (cancelled) {
          return;
        }

        const active = status === 'pending' || status === 'running';
        setStreaming(active);

        if (!active && timer) {
          clearInterval(timer);
          timer = null;
        }
      } catch {
        if (!cancelled) {
          setStreaming(false);
        }
      }
    };

    poll();
    timer = setInterval(poll, 1500);

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [clearActivity, currentSession?.id, currentSession?.taskId, setStreaming, syncTaskActivity]);

  const handleSendMessage = async ({ input, attachment }: ChatInputPayload) => {
    const sessionId = currentSessionId ?? createNewSession();
    setCurrentSession(sessionId);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now(),
      attachment: attachment
        ? {
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          kind: attachment.kind,
          truncated: attachment.truncated,
        }
        : undefined,
    };
    addMessage(sessionId, userMessage);
    updateSession(sessionId, { title: input.slice(0, 60) || attachment?.fileName || 'New Conversation' });

    setStreaming(true);
    clearActivity();
    setGoal(input);

    try {
      const task = await createTask({ input, attachment });
      const taskId = getEntityId(task);

      updateSession(sessionId, {
        taskId,
        taskStatus: task.status,
      });

      await syncTaskActivity(sessionId, taskId);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        forceLogin();
        return;
      }

      const message = error instanceof Error ? error.message : 'Failed to create task';
      addMessage(sessionId, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Request failed: ${message}`,
        timestamp: Date.now(),
      });
      setStreaming(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-neutral-200 px-4 py-2 sm:min-h-18 sm:px-6 dark:border-neutral-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Sparkles size={16} className="text-neutral-900 dark:text-neutral-100" />
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-1">
              <h1 className="truncate text-xs font-bold uppercase leading-none tracking-tight sm:text-sm">Wind</h1>
              <div className="flex min-w-0 items-center gap-1.5 leading-none">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="truncate text-[10px] font-semibold text-neutral-400">Autonomous Mode Active</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleSidebar()}
                title="Open sidebar"
              >
                <PanelLeftOpen size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 xl:hidden"
              onClick={() => toggleRightPanel()}
            >
              <Activity size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex">
              <Share2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings2 size={16} />
            </Button>
          </div>
        </header>

        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="mx-auto w-full max-w-3xl min-w-0">
            {currentSession?.messages.length === 0 ? (
              <div className="flex h-[60vh] flex-col items-center justify-center text-center px-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                >
                  <Sparkles size={32} />
                </motion.div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  How can I help you today?
                </h2>
                <p className="mt-2 max-w-md text-sm text-neutral-500">
                  I'm Wind, your autonomous AI assistant. I can plan complex tasks, use tools, and research the web to provide accurate results.
                </p>

                <div className="mt-12 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    "Research latest AI trends in 2024",
                    "Analyze my portfolio performance",
                    "Plan a 3-day trip to Tokyo",
                    "Explain quantum entanglement simply"
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage({ input: prompt })}
                      className="rounded-2xl border border-neutral-200 p-4 text-left text-xs font-medium transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {currentSession?.messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isStreaming && (
                  <div className="flex gap-4 py-8 px-8">
                    <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
                      <Bot size={16} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase text-neutral-400">Wind is thinking...</span>
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-32" />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
      </div>

      {/* Right Panel */}
      <AnimatePresence>
        {isRightPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRightPanel(false)}
            className="fixed inset-0 z-40 bg-neutral-950/20 backdrop-blur-sm xl:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        'fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-neutral-200 bg-white transition-transform duration-300 dark:border-neutral-800 dark:bg-neutral-950 xl:relative xl:z-0 xl:w-80 xl:max-w-none xl:flex-none',
        isRightPanelOpen
          ? 'translate-x-0'
          : 'translate-x-full xl:w-0 xl:min-w-0 xl:border-l-0 xl:opacity-0 xl:pointer-events-none'
      )}>
        <AgentActivityPanel />
      </div>
    </div>
  );
};
