export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CreateTaskInput {
  input: string;
}

export interface AgentStepEvent {
  taskId: string;
  agent: string;
  step: string;
  status: TaskStatus;
}
