import { Schema, model, type Document } from 'mongoose';

export const AI_MODELS = ['wind-v2.5', 'wind-v2.0', 'deepthink-1.0'] as const;
const LEGACY_AI_MODEL_MAP: Record<string, AiModel> = {
  'aura-v2.5': 'wind-v2.5',
  'aura-v2.0': 'wind-v2.0',
};

export type AiModel = (typeof AI_MODELS)[number];

export interface UserSettings {
  aiModel: AiModel;
  temperature: number;
  requireToolApproval: boolean;
  autonomousMode: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  aiModel: 'wind-v2.5',
  temperature: 0.6,
  requireToolApproval: true,
  autonomousMode: false,
};

export function normalizeAiModel(value: string | undefined): AiModel {
  if (!value) {
    return DEFAULT_USER_SETTINGS.aiModel;
  }

  return LEGACY_AI_MODEL_MAP[value] ?? (AI_MODELS.includes(value as AiModel) ? (value as AiModel) : DEFAULT_USER_SETTINGS.aiModel);
}

export function normalizeUserSettings(settings?: Partial<UserSettings>): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    ...settings,
    aiModel: normalizeAiModel(settings?.aiModel),
  };
}

export interface UserDocument extends Document {
  email: string;
  name: string;
  passwordHash: string;
  refreshTokenVersion: number;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<UserSettings>(
  {
    aiModel: {
      type: String,
      enum: AI_MODELS,
      default: DEFAULT_USER_SETTINGS.aiModel,
      required: true,
    },
    temperature: {
      type: Number,
      min: 0,
      max: 1,
      default: DEFAULT_USER_SETTINGS.temperature,
      required: true,
    },
    requireToolApproval: {
      type: Boolean,
      default: DEFAULT_USER_SETTINGS.requireToolApproval,
      required: true,
    },
    autonomousMode: {
      type: Boolean,
      default: DEFAULT_USER_SETTINGS.autonomousMode,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    refreshTokenVersion: { type: Number, default: 1 },
    settings: { type: userSettingsSchema, default: DEFAULT_USER_SETTINGS },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<UserDocument>('User', userSchema);
