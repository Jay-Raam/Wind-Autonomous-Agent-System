import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../models/user.model.js';
import { env } from '../config/env.js';

async function run(): Promise<void> {
  await connectDatabase();

  const exists = await UserModel.findOne({ email: 'demo@wind.ai' }).exec();

  if (!exists) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', env.BCRYPT_SALT_ROUNDS);

    await UserModel.create({
      email: 'demo@wind.ai',
      name: 'Demo User',
      passwordHash,
    });
  }

  await disconnectDatabase();
  await mongoose.connection.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
