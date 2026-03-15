import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';
import { AppError } from '../utils/errors.js';

export function validateBody(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new AppError(result.error.errors[0]?.message ?? 'Invalid request body', 400, 'VALIDATION_ERROR'));
      return;
    }

    req.body = result.data;
    next();
  };
}
