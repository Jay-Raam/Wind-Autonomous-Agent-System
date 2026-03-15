import type { NextFunction, Request, Response } from 'express';
import { SettingsService } from '../services/settings.service.js';

const settingsService = new SettingsService();

export class SettingsController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getSettings(req.user!.id);
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.updateSettings(req.user!.id, req.body);
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }
}