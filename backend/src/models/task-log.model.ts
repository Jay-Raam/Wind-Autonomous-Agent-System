import { Schema, model, type Document, type Types } from 'mongoose';

export interface TaskLogDocument extends Document {
  taskId: Types.ObjectId;
  event: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const taskLogSchema = new Schema<TaskLogDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    event: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

taskLogSchema.index({ taskId: 1, createdAt: 1 });

export const TaskLogModel = model<TaskLogDocument>('TaskLog', taskLogSchema);
