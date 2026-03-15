import { z } from 'zod';

const attachmentSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  size: z.number().int().min(1).max(15_000_000),
  kind: z.enum(['code', 'csv', 'text', 'json', 'markdown', 'pdf']),
  content: z.string().min(1).max(120_000),
  truncated: z.boolean(),
});

export const createTaskSchema = z.object({
  input: z.string().trim().min(1).max(10000),
  attachment: attachmentSchema.optional(),
});
