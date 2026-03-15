import { Schema, model, type Document, type Types } from 'mongoose';
import type { TaskStatus } from '../types/task.types.js';

export interface TaskDocument extends Document {
  userId: Types.ObjectId;
  status: TaskStatus;
  input: string;
  result?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    result: { type: String },
    error: { type: String },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ userId: 1, createdAt: -1 });

taskSchema.index({ status: 1, updatedAt: -1 });

export const TaskModel = model<TaskDocument>('Task', taskSchema);
