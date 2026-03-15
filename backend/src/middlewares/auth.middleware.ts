import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import type { JwtPayload } from '../types/auth.types.js';
import { UserRepository } from '../repositories/user.repository.js';
import { AUTH_COOKIE_NAMES, getCookieValue } from '../utils/cookies.js';

const userRepository = new UserRepository();

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = req.headers.authorization;
    const tokenFromCookie = getCookieValue(req.headers.cookie, AUTH_COOKIE_NAMES.access);
    const tokenFromHeader = authorization?.startsWith('Bearer ') ? authorization.replace('Bearer ', '') : null;
    const token = tokenFromHeader ?? tokenFromCookie;

    if (!token) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    if (payload.type !== 'access') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN');
    }

    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch {
    next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }
}
