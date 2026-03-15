import type { Response } from 'express';

const ACCESS_COOKIE_NAME = 'wind_access_token';
const REFRESH_COOKIE_NAME = 'wind_refresh_token';

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, cookiePart) => {
      const index = cookiePart.indexOf('=');

      if (index <= 0) {
        return acc;
      }

      const key = cookiePart.slice(0, index).trim();
      const value = cookiePart.slice(index + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

export function getCookieValue(cookieHeader: string | undefined, key: string): string | null {
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[key] ?? null;
}

function toSeconds(ttl: string): number {
  const value = ttl.trim().toLowerCase();
  const match = value.match(/^(\d+)([smhd])$/);

  if (!match) {
    return 900;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      return 900;
  }
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  accessTtl: string,
  refreshTtl: string,
): void {
  const secure = process.env.NODE_ENV === 'production';

  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: toSeconds(accessTtl) * 1000,
  });

  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: toSeconds(refreshTtl) * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  const secure = process.env.NODE_ENV === 'production';

  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  });

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  });
}

export const AUTH_COOKIE_NAMES = {
  access: ACCESS_COOKIE_NAME,
  refresh: REFRESH_COOKIE_NAME,
} as const;