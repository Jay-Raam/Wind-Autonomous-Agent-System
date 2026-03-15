import { Schema, model, type Document, type Types } from 'mongoose';

export interface ToolDocument extends Document {
  taskId: Types.ObjectId;
  name: 'WebSearchTool' | 'CalculatorTool' | 'DocumentReaderTool';
  query: string;
  result?: string;
  status: 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const toolSchema = new Schema<ToolDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    name: {
      type: String,
      enum: ['WebSearchTool', 'CalculatorTool', 'DocumentReaderTool'],
      required: true,
      index: true,
    },
    query: { type: String, required: true },
    result: { type: String },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
      index: true,
    },
  },
  { timestamps: true },
);

toolSchema.index({ taskId: 1, createdAt: -1 });

export const ToolModel = model<ToolDocument>('Tool', toolSchema);
