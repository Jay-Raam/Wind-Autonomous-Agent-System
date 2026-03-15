export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export type TaskAttachmentKind = 'code' | 'csv' | 'text' | 'json' | 'markdown' | 'pdf';

export interface TaskTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TaskAttachment {
  fileName: string;
  mimeType: string;
  size: number;
  kind: TaskAttachmentKind;
  content: string;
  truncated: boolean;
}

export interface CreateTaskInput {
  input: string;
  attachment?: TaskAttachment;
}

export interface AgentStepEvent {
  taskId: string;
  agent: string;
  step: string;
  status: TaskStatus;
}
