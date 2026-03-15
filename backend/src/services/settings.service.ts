import { AppError } from '../utils/errors.js';
import { UserRepository } from '../repositories/user.repository.js';
import { DEFAULT_USER_SETTINGS, type UserSettings } from '../models/user.model.js';

export class SettingsService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async getSettings(userId: string): Promise<UserSettings> {
    const settings = await this.userRepository.getSettings(userId);

    if (!settings) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return { ...DEFAULT_USER_SETTINGS, ...settings };
  }

  async updateSettings(userId: string, input: UserSettings): Promise<UserSettings> {
    const settings = await this.userRepository.updateSettings(userId, input);

    if (!settings) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return settings;
  }
}