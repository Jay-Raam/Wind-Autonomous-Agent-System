const apiEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
const API_BASE_URL = apiEnv?.VITE_API_BASE_URL ?? 'http://localhost:8080';
const API_PREFIX = `${API_BASE_URL}/api`;

export const USER_EMAIL_KEY = 'wind.userEmail';

export type AttachmentKind = 'code' | 'csv' | 'text' | 'json' | 'markdown' | 'pdf';

export interface TaskAttachmentInput {
  fileName: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  content: string;
  truncated: boolean;
}

export interface CreateTaskPayload {
  input: string;
  attachment?: TaskAttachmentInput;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthCredentials {
  email: string;
  password: string;
}

interface RegisterInput extends AuthCredentials {
  name: string;
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface TaskItem {
  id?: string;
  _id?: string;
  input: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attachment?: Omit<TaskAttachmentInput, 'content'>;
  result?: string;
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AgentItem {
  id?: string;
  _id?: string;
  name: 'PlannerAgent' | 'ResearchAgent' | 'AnalysisAgent' | 'WriterAgent';
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  createdAt: string;
  updatedAt: string;
}

interface ToolItem {
  id?: string;
  _id?: string;
  name: 'WebSearchTool' | 'CalculatorTool' | 'DocumentReaderTool';
  query: string;
  result?: string;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface TaskDetailResponse {
  task: TaskItem;
  logs: Array<{
    id?: string;
    _id?: string;
    event: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
}

export const AI_MODEL_OPTIONS = [
  { value: 'wind-v2.5', label: 'Wind v2.5 (Latest)' },
  { value: 'wind-v2.0', label: 'Wind v2.0 (Legacy)' },
  { value: 'deepthink-1.0', label: 'DeepThink 1.0' },
] as const;

export type AiModel = (typeof AI_MODEL_OPTIONS)[number]['value'];

export interface SystemSettings {
  aiModel: AiModel;
  temperature: number;
  requireToolApproval: boolean;
  autonomousMode: boolean;
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function parseApiError(response: Response): Promise<Error> {
  try {
    const payload = await readJson<ApiErrorPayload>(response);
    const message = payload.error?.message ?? `Request failed with status ${response.status}`;
    return new ApiError(message, response.status, payload.error?.code);
  } catch {
    return new ApiError(`Request failed with status ${response.status}`, response.status);
  }
}

async function refreshAccessToken(): Promise<AuthTokens> {
  const response = await fetch(`${API_PREFIX}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return readJson<AuthTokens>(response);
}

export async function refreshSession(): Promise<AuthTokens> {
  return refreshAccessToken();
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_PREFIX}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function loginUser(input: AuthCredentials): Promise<AuthTokens> {
  const response = await fetch(`${API_PREFIX}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const tokens = await readJson<AuthTokens>(response);
  localStorage.setItem(USER_EMAIL_KEY, input.email);
  return tokens;
}

export async function registerUser(input: RegisterInput): Promise<AuthTokens> {
  const response = await fetch(`${API_PREFIX}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const tokens = await readJson<AuthTokens>(response);
  localStorage.setItem(USER_EMAIL_KEY, input.email);
  return tokens;
}

async function request<T>(path: string, init: RequestInit = {}, requiresAuth = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && requiresAuth) {
    try {
      await refreshSession();

      const retry = await fetch(`${API_PREFIX}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      });

      if (!retry.ok) {
        throw await parseApiError(retry);
      }

      return readJson<T>(retry);
    } catch {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return readJson<T>(response);
}

export function getEntityId(entity: { id?: string; _id?: string }): string {
  return entity.id ?? entity._id ?? '';
}

export async function listTasks(): Promise<TaskItem[]> {
  return request<TaskItem[]>('/tasks');
}

export async function createTask(input: string | CreateTaskPayload): Promise<TaskItem> {
  const payload = typeof input === 'string' ? { input } : input;

  return request<TaskItem>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTaskById(taskId: string): Promise<TaskDetailResponse> {
  return request<TaskDetailResponse>(`/tasks/${taskId}`);
}

export async function listAgentsByTask(taskId: string): Promise<AgentItem[]> {
  return request<AgentItem[]>(`/agents/tasks/${taskId}`);
}

export async function listToolsByTask(taskId: string): Promise<ToolItem[]> {
  return request<ToolItem[]>(`/tools/tasks/${taskId}`);
}

export async function getSettings(): Promise<SystemSettings> {
  return request<SystemSettings>('/settings');
}

export async function updateSettings(input: SystemSettings): Promise<SystemSettings> {
  return request<SystemSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
