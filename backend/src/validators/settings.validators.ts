import { z } from 'zod';
import { AI_MODELS } from '../models/user.model.js';

export const updateSettingsSchema = z.object({
  aiModel: z.enum(AI_MODELS),
  temperature: z.number().min(0).max(1),
  requireToolApproval: z.boolean(),
  autonomousMode: z.boolean(),
});