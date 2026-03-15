import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Globe, Zap, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/helpers';
import type { CreateTaskPayload, TaskAttachmentInput } from '../../utils/api';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// Initialise the PDF.js worker once at module load so it is available for all
// subsequent extraction calls without repeating the setup per component mount.
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;      // 2 MB for text/code files
const PDF_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB for PDFs
const MAX_FILE_CONTENT_CHARS = 120_000;

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string }>)
      .map((item) => item.str ?? '')
      .join(' ')
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join('\n\n');
}

const CODE_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cc', 'cpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'kts',
  'scala', 'sh', 'bash', 'zsh', 'ps1', 'sql', 'html', 'css', 'scss', 'sass', 'less', 'xml', 'yaml', 'yml', 'toml',
  'ini', 'env', 'graphql', 'gql', 'vue', 'svelte', 'dart', 'r', 'm', 'pl', 'lua', 'dockerfile'
]);

function getExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  if (normalized === 'dockerfile') {
    return 'dockerfile';
  }

  const segments = normalized.split('.');
  return segments.length > 1 ? segments[segments.length - 1] : '';
}

function inferAttachmentKind(file: File): TaskAttachmentInput['kind'] {
  const extension = getExtension(file.name);

  if (extension === 'pdf' || file.type === 'application/pdf') {
    return 'pdf';
  }

  if (extension === 'csv' || file.type === 'text/csv') {
    return 'csv';
  }

  if (extension === 'json' || file.type === 'application/json') {
    return 'json';
  }

  if (extension === 'md' || extension === 'mdx' || file.type === 'text/markdown') {
    return 'markdown';
  }

  if (CODE_EXTENSIONS.has(extension)) {
    return 'code';
  }

  return 'text';
}

function isLikelyTextFile(file: File): boolean {
  const extension = getExtension(file.name);
  if (
    extension === 'pdf' || file.type === 'application/pdf' ||
    extension === 'csv' || extension === 'json' ||
    extension === 'md' || extension === 'mdx' ||
    CODE_EXTENSIONS.has(extension)
  ) {
    return true;
  }

  return file.type.startsWith('text/') || file.type === 'application/json';
}

export interface ChatInputPayload extends CreateTaskPayload { }

interface ChatInputProps {
  onSend: (payload: ChatInputPayload) => void | Promise<void>;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<TaskAttachmentInput | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = input.trim();

    if (!message || disabled || isReadingFile) {
      return;
    }

    setErrorMessage(null);
    await onSend({ input: message, attachment });
    setInput('');
    setAttachment(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setErrorMessage(null);

    const isPdf = getExtension(file.name) === 'pdf' || file.type === 'application/pdf';

    if (!isLikelyTextFile(file)) {
      setAttachment(undefined);
      setErrorMessage('Only text, code, markdown, JSON, CSV, and PDF files are supported right now.');
      event.target.value = '';
      return;
    }

    const sizeLimit = isPdf ? PDF_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;

    if (file.size > sizeLimit) {
      setAttachment(undefined);
      setErrorMessage(
        isPdf
          ? 'PDF is too large. Keep it under 10 MB.'
          : 'Selected file is too large. Keep it under 2 MB.',
      );
      event.target.value = '';
      return;
    }

    setIsReadingFile(true);

    try {
      let rawContent: string;

      if (isPdf) {
        rawContent = await extractPdfText(file);

        if (!rawContent.trim()) {
          setAttachment(undefined);
          setErrorMessage(
            'Could not extract text from this PDF. It may be an image-based scan or encrypted.',
          );
          event.target.value = '';
          return;
        }
      } else {
        rawContent = await file.text();

        if (!rawContent.trim()) {
          setAttachment(undefined);
          setErrorMessage('The selected file is empty.');
          event.target.value = '';
          return;
        }

        if (/\u0000/.test(rawContent)) {
          setAttachment(undefined);
          setErrorMessage('Binary files are not supported. Please choose a text-based file.');
          event.target.value = '';
          return;
        }
      }

      const truncated = rawContent.length > MAX_FILE_CONTENT_CHARS;

      setAttachment({
        fileName: file.name,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
        size: file.size,
        kind: inferAttachmentKind(file),
        content: truncated ? rawContent.slice(0, MAX_FILE_CONTENT_CHARS) : rawContent,
        truncated,
      });
    } catch {
      setAttachment(undefined);
      setErrorMessage(isPdf ? 'Failed to extract text from the PDF.' : 'Failed to read the selected file.');
      event.target.value = '';
    } finally {
      setIsReadingFile(false);
    }
  };

  const clearAttachment = () => {
    setAttachment(undefined);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isReadingFile}
        />

        {(attachment || errorMessage) && (
          <div className="px-4 pb-1 sm:px-6">
            {attachment ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-950/70">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-700 dark:text-neutral-200">{attachment.fileName}</p>
                  <p className="text-[11px] text-neutral-500">
                    {attachment.kind.toUpperCase()} · {(attachment.size / 1024).toFixed(1)} KB{attachment.truncated ? ' · truncated for analysis' : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={clearAttachment}
                >
                  <X size={14} />
                </Button>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="pt-2 text-xs text-rose-500">{errorMessage}</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isReadingFile}
              title="Attach a file"
            >
              <Paperclip size={18} />
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
            disabled={!input.trim() || disabled || isReadingFile}
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
        Wind can analyze one attached file (text, code, CSV, JSON, or PDF) per prompt. Check important info.
      </p>
    </div>
  );
};
