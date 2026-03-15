import { create } from 'zustand';
import { Message, ChatSession } from '../types';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isStreaming: boolean;
  addMessage: (sessionId: string, message: Message) => void;
  createNewSession: () => string;
  setSessions: (sessions: ChatSession[]) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  setCurrentSession: (id: string) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  currentSessionId: null,
  isStreaming: false,
  addMessage: (sessionId, message) => set((state) => ({
    sessions: state.sessions.map((s) => 
      s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
    )
  })),
  createNewSession: () => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      sessions: [
        { id, title: 'New Conversation', messages: [], createdAt: Date.now() },
        ...state.sessions
      ],
      currentSessionId: id
    }));
    return id;
  },
  setSessions: (sessions) => set((state) => ({
    sessions,
    currentSessionId: state.currentSessionId ?? sessions[0]?.id ?? null,
  })),
  updateSession: (sessionId, updates) => set((state) => ({
    sessions: state.sessions.map((session) =>
      session.id === sessionId ? { ...session, ...updates } : session,
    ),
  })),
  setCurrentSession: (id) => set({ currentSessionId: id }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
}));
