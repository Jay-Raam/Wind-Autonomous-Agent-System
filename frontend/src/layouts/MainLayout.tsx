import React, { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import {
  MessageSquare,
  Plus,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

import { useUIStore } from '../store/uiStore';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessions, currentSessionId, createNewSession, setCurrentSession } = useChatStore();
  const { isSidebarOpen, toggleSidebar, setSidebar, syncViewport } = useUIStore();
  const { email, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    syncViewport(window.innerWidth);

    const handleResize = () => {
      syncViewport(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [syncViewport]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebar(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebar(false)}
            className="fixed inset-0 z-40 bg-neutral-950/20 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(85vw,18rem)] max-w-[18rem] flex-col border-r border-neutral-200 bg-neutral-50 transition-transform duration-300 dark:border-neutral-800 dark:bg-neutral-900 lg:relative lg:z-0 lg:w-72 lg:max-w-none lg:flex-none',
          isSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:w-0 lg:min-w-0 lg:border-r-0 lg:opacity-0 lg:pointer-events-none'
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100">
              <Sparkles size={14} className="text-white dark:text-neutral-900" />
            </div>
            <span className="text-sm font-bold tracking-tighter uppercase">Wind</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => toggleSidebar()}>
            <PanelLeftClose size={18} />
          </Button>
        </div>

        <div className="px-4 py-2">
          <Button
            onClick={() => {
              createNewSession();
              closeSidebarOnMobile();
            }}
            className="w-full justify-start gap-2 bg-white shadow-sm dark:bg-neutral-800"
            variant="outline"
          >
            <Plus size={16} />
            <span className="text-xs font-semibold">New Chat</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Recent Conversations
          </div>
          <div className="space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  setCurrentSession(session.id);
                  closeSidebarOnMobile();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  currentSessionId === session.id ? "bg-white shadow-sm dark:bg-neutral-800" : "text-neutral-500"
                )}
              >
                <MessageSquare size={16} className="shrink-0" />
                <span className="truncate text-xs font-medium">{session.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex flex-col">
                <span className="text-xs font-bold">{email ?? 'User'}</span>
                <span className="text-[10px] text-neutral-400">Pro Plan</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void handleLogout()} title="Logout">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};
