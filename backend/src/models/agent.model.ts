import { Schema, model, type Document, type Types } from 'mongoose';

export interface AgentDocument extends Document {
  taskId: Types.ObjectId;
  name: 'PlannerAgent' | 'ResearchAgent' | 'AnalysisAgent' | 'WriterAgent';
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<AgentDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    name: {
      type: String,
      enum: ['PlannerAgent', 'ResearchAgent', 'AnalysisAgent', 'WriterAgent'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    output: { type: String },
  },
  { timestamps: true },
);

agentSchema.index({ taskId: 1, createdAt: 1 });

export const AgentModel = model<AgentDocument>('Agent', agentSchema);
