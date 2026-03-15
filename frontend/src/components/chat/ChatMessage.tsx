import React from 'react';
import { motion } from 'motion/react';
import { Message } from '../../types';
import { cn, formatDate } from '../../utils/helpers';
import { User, Bot, Copy, Check, Coins } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

function normalizeAssistantContent(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n').trim();

  const formattedLines = normalized.split('\n').map((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return '';
    }

    if (/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s|```)/.test(trimmed)) {
      return trimmed;
    }

    const labelMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9 /&'()_-]{1,60}):\s*(.+)$/);
    if (labelMatch) {
      return `**${labelMatch[1]}:** ${labelMatch[2]}`;
    }

    const headingMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9 /&'()_-]{1,60}):$/);
    if (headingMatch) {
      return `## ${headingMatch[1]}`;
    }

    return trimmed;
  });

  return formattedLines
    .join('\n')
    .replace(/([^\n])\n(?=##\s)/g, '$1\n\n')
    .replace(/([^\n])\n(?=\*\*)/g, '$1\n\n')
    .replace(/([^\n])\n(?=-|\d+\.\s)/g, '$1\n\n')
    .replace(/\n{3,}/g, '\n\n');
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';
  const renderedContent = isUser ? message.content : normalizeAssistantContent(message.content);

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
        'flex w-full px-4 py-5 md:px-8',
        isUser ? 'justify-end' : 'bg-neutral-50/60 dark:bg-neutral-950/20'
      )}
    >
      <div className={cn('flex w-full max-w-3xl gap-4', isUser ? 'max-w-xl flex-row-reverse' : '')}>
        <div className={cn(
          'mt-1 flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-2xl border shadow-sm',
          isUser ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div className={cn(
          'min-w-0 flex-1 overflow-hidden rounded-[28px] border p-4 md:p-5',
          isUser
            ? 'border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900'
            : 'border-neutral-200/80 bg-white/95 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80'
        )}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {isUser ? 'You' : 'Wind'}
            </span>
            <span className="shrink-0 text-[10px] text-neutral-400">
              {formatDate(message.timestamp)}
            </span>
          </div>

          {message.attachment ? (
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900/80">
              <span className="truncate font-semibold text-neutral-700 dark:text-neutral-200">{message.attachment.fileName}</span>
              <span className="shrink-0 text-neutral-500">
                {message.attachment.kind.toUpperCase()} · {(message.attachment.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ) : null}

          <div className="max-w-none wrap-break-word text-[15px] leading-7 text-neutral-700 dark:text-neutral-300">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="mb-4 mt-1 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-3 mt-6 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-2 mt-5 text-base font-semibold text-neutral-900 dark:text-neutral-100">{children}</h3>,
                p: ({ children }) => <p className="mb-4 whitespace-pre-wrap text-[15px] leading-7 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-2">{children}</ol>,
                li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-neutral-950 dark:text-neutral-100">{children}</strong>,
                blockquote: ({ children }) => <blockquote className="mb-4 border-l-2 border-neutral-300 pl-4 italic text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">{children}</blockquote>,
                code: ({ children }) => <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[0.92em] dark:bg-neutral-800">{children}</code>,
                pre: ({ children }) => <pre className="mb-4 overflow-x-auto rounded-2xl bg-neutral-950/95 p-4">{children}</pre>,
              }}
            >
              {renderedContent}
            </ReactMarkdown>
          </div>

          {!isUser && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {message.tokenUsage && message.tokenUsage.totalTokens > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                  <Coins size={12} />
                  {message.tokenUsage.totalTokens.toLocaleString()} tokens
                  <span className="text-neutral-400 dark:text-neutral-500">
                    {message.tokenUsage.promptTokens.toLocaleString()} in · {message.tokenUsage.completionTokens.toLocaleString()} out
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
