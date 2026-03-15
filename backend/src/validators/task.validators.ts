import { z } from 'zod';

export const createTaskSchema = z.object({
  input: z.string().trim().min(1).max(10000),
});
