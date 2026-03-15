import { Schema, model, type Document, type Types } from 'mongoose';
import type { TaskAttachment, TaskStatus, TaskTokenUsage } from '../types/task.types.js';

export interface TaskDocument extends Document {
  userId: Types.ObjectId;
  status: TaskStatus;
  input: string;
  attachment?: TaskAttachment;
  result?: string;
  error?: string;
  tokenUsage?: TaskTokenUsage;
  createdAt: Date;
  updatedAt: Date;
}

const taskAttachmentSchema = new Schema<TaskAttachment>(
  {
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    kind: {
      type: String,
      enum: ['code', 'csv', 'text', 'json', 'markdown', 'pdf'],
      required: true,
    },
    content: { type: String, required: true, select: false },
    truncated: { type: Boolean, required: true, default: false },
  },
  {
    _id: false,
  },
);

const taskSchema = new Schema<TaskDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    input: { type: String, required: true },
    attachment: { type: taskAttachmentSchema, required: false },
    result: { type: String },
    error: { type: String },
    tokenUsage: {
      type: new Schema<TaskTokenUsage>(
        {
          promptTokens: { type: Number, default: 0 },
          completionTokens: { type: Number, default: 0 },
          totalTokens: { type: Number, default: 0 },
        },
        { _id: false },
      ),
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.set('toJSON', {
  transform: (_doc, ret: { attachment?: { content?: string } }) => {
    if (ret.attachment) {
      delete ret.attachment.content;
    }

    return ret;
  },
});

taskSchema.index({ userId: 1, createdAt: -1 });

taskSchema.index({ status: 1, updatedAt: -1 });

export const TaskModel = model<TaskDocument>('Task', taskSchema);
