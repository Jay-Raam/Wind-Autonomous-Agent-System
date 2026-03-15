import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../../types';
import { cn, formatDate } from '../../utils/helpers';
import { User, Bot, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex w-full gap-4 py-8 px-4 md:px-8',
        isUser ? 'bg-transparent' : 'bg-neutral-50/50 dark:bg-neutral-900/30'
      )}
    >
      <div className={cn(
        'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm',
        isUser ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {isUser ? 'You' : 'Wind'}
          </span>
          <span className="text-[10px] text-neutral-400">
            {formatDate(message.timestamp)}
          </span>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none break-words text-neutral-700 dark:text-neutral-300">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {!isUser && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
