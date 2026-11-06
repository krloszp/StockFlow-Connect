import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service.js';

export const getBusinessSettingsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await settingsService.getBusinessSettings();
    res.status(200).json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateBusinessSettingsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await settingsService.updateBusinessSettings(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
