import { create } from 'zustand';
import { AgentStep, ToolExecution, TaskPlanStep } from '../types';

interface AgentState {
  steps: AgentStep[];
  toolExecutions: ToolExecution[];
  plan: TaskPlanStep[];
  goal: string | null;
  setSteps: (steps: AgentStep[]) => void;
  setToolExecutions: (tools: ToolExecution[]) => void;
  addStep: (step: AgentStep) => void;
  addToolExecution: (tool: ToolExecution) => void;
  updateToolExecution: (id: string, updates: Partial<ToolExecution>) => void;
  setPlan: (plan: TaskPlanStep[]) => void;
  setGoal: (goal: string) => void;
  clearActivity: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  steps: [],
  toolExecutions: [],
  plan: [],
  goal: null,
  setSteps: (steps) => set({ steps }),
  setToolExecutions: (toolExecutions) => set({ toolExecutions }),
  addStep: (step) => set((state) => ({ steps: [step, ...state.steps] })),
  addToolExecution: (tool) => set((state) => ({ toolExecutions: [tool, ...state.toolExecutions] })),
  updateToolExecution: (id, updates) => set((state) => ({
    toolExecutions: state.toolExecutions.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),
  setPlan: (plan) => set({ plan }),
  setGoal: (goal) => set({ goal }),
  clearActivity: () => set({ steps: [], toolExecutions: [], plan: [], goal: null }),
}));
