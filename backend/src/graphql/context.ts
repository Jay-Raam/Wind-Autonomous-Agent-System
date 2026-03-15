import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types/auth.types.js';
import { AUTH_COOKIE_NAMES, getCookieValue } from '../utils/cookies.js';

export interface GraphqlContext {
  req: Request;
  userId: string | null;
}

export function buildGraphqlContext(req: Request): GraphqlContext {
  const authorization = req.headers.authorization;
  const tokenFromHeader = authorization?.startsWith('Bearer ') ? authorization.replace('Bearer ', '') : null;
  const tokenFromCookie = getCookieValue(req.headers.cookie, AUTH_COOKIE_NAMES.access);
  const token = tokenFromHeader ?? tokenFromCookie;

  if (!token) {
    return { req, userId: null };
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    if (payload.type !== 'access') {
      return { req, userId: null };
    }

    return { req, userId: payload.sub };
  } catch {
    return { req, userId: null };
  }
}
