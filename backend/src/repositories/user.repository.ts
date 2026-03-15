import {
  DEFAULT_USER_SETTINGS,
  UserModel,
  normalizeUserSettings,
  type UserDocument,
  type UserSettings,
} from '../models/user.model.js';

export class UserRepository {
  async create(data: Pick<UserDocument, 'email' | 'name' | 'passwordHash'>): Promise<UserDocument> {
    return UserModel.create(data);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id).exec();
  }

  async bumpRefreshTokenVersion(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $inc: { refreshTokenVersion: 1 } }).exec();
  }

  async getSettings(id: string): Promise<UserSettings | null> {
    const user = await UserModel.findById(id).select('settings').lean<{ settings?: UserSettings } | null>().exec();

    if (!user) {
      return null;
    }

    return normalizeUserSettings({ ...DEFAULT_USER_SETTINGS, ...user.settings });
  }

  async updateSettings(id: string, settings: UserSettings): Promise<UserSettings | null> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: { settings } },
      { new: true, runValidators: true },
    )
      .select('settings')
      .lean<{ settings?: UserSettings } | null>()
      .exec();

    if (!user) {
      return null;
    }

    return normalizeUserSettings({ ...DEFAULT_USER_SETTINGS, ...user.settings });
  }
}
