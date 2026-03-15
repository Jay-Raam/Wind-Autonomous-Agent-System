import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';
import type { JwtPayload } from '../types/auth.types.js';

const ACCESS_EXPIRES_IN = env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'];
const REFRESH_EXPIRES_IN = env.JWT_REFRESH_TTL as jwt.SignOptions['expiresIn'];

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async register(input: RegisterInput): Promise<{ accessToken: string; refreshToken: string }> {
    const existingUser = await this.userRepository.findByEmail(input.email.toLowerCase());

    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    const user = await this.userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(input: LoginInput): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase());

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: JwtPayload;

    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new AppError('User not found', 401, 'INVALID_REFRESH_TOKEN');
    }

    return this.generateTokens(user.id, user.email);
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.bumpRefreshTokenVersion(userId);
  }

  private generateTokens(userId: string, email: string): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { sub: userId, email, type: 'access' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN },
    );

    const refreshToken = jwt.sign(
      { sub: userId, email, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN },
    );

    return { accessToken, refreshToken };
  }
}
