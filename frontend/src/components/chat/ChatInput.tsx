import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Globe, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/helpers';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="relative mx-auto w-full max-w-3xl px-3 pb-6 pt-2 sm:px-4 sm:pb-8">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg transition-all focus-within:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/80 dark:shadow-2xl dark:focus-within:border-neutral-600"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Wind anything..."
          className="w-full resize-none bg-transparent px-4 py-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none sm:px-6 dark:text-neutral-100"
          disabled={disabled}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
              <Plus size={18} />
            </Button>
            <div className="mx-1 hidden h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 xs:block" />
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Globe size={14} />
              <span className="hidden xs:inline">Web Search</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Zap size={14} />
              <span className="hidden xs:inline">Deep Think</span>
            </Button>
          </div>

          <Button
            type="submit"
            disabled={!input.trim() || disabled}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all",
              input.trim() ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
            )}
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
      <p className="mt-3 text-center text-[10px] text-neutral-400">
        Wind can make mistakes. Check important info.
      </p>
    </div>
  );
};
