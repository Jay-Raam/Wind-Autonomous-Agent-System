import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { UserModel } from '../models/user.model.js';
import { TaskModel } from '../models/task.model.js';
import { AgentModel } from '../models/agent.model.js';
import { ToolModel } from '../models/tool.model.js';
import { TaskLogModel } from '../models/task-log.model.js';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 30,
    minPoolSize: 5,
  });

  logger.info({ db: 'mongodb' }, 'MongoDB connected');
}

export async function ensureMongoIndexes(): Promise<void> {
  await Promise.all([
    UserModel.syncIndexes(),
    TaskModel.syncIndexes(),
    AgentModel.syncIndexes(),
    ToolModel.syncIndexes(),
    TaskLogModel.syncIndexes(),
  ]);

  logger.info('MongoDB indexes synchronized from models');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
