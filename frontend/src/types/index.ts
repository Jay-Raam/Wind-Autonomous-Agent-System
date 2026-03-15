export type AgentRole = 'planner' | 'researcher' | 'analyzer' | 'writer' | 'executor';

export interface AgentStep {
  id: string;
  agentName: string;
  role: AgentRole;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp: number;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  query: string;
  result?: string;
  status: 'running' | 'completed' | 'failed';
}

export interface TaskPlanStep {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  taskId?: string;
  taskStatus?: 'pending' | 'running' | 'completed' | 'failed';
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
