import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { AUTH_COOKIE_NAMES, clearAuthCookies, getCookieValue, setAuthCookies } from '../utils/cookies.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.register(req.body);
      setAuthCookies(res, tokens, env.JWT_ACCESS_TTL, env.JWT_REFRESH_TTL);
      res.status(201).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.login(req.body);
      setAuthCookies(res, tokens, env.JWT_ACCESS_TTL, env.JWT_REFRESH_TTL);
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshTokenFromCookie = getCookieValue(req.headers.cookie, AUTH_COOKIE_NAMES.refresh);
      const refreshToken = refreshTokenFromCookie ?? req.body.refreshToken;

      if (!refreshToken) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      const tokens = await authService.refresh(refreshToken);
      setAuthCookies(res, tokens, env.JWT_ACCESS_TTL, env.JWT_REFRESH_TTL);
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user!.id);
      clearAuthCookies(res);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
