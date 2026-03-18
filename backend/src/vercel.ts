import { createApp } from './app.js';
import { connectDatabase, ensureMongoIndexes } from './config/database.js';

const app = createApp();
let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await connectDatabase();
    await ensureMongoIndexes();
    initialized = true;
  }
}

export default async function handler(req: any, res: any): Promise<void> {
  await ensureInitialized();
  app(req, res);
}
