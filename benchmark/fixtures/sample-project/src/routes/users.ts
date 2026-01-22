import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { CreateUserSchema, UserPreferencesSchema } from '../models/User';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

export const userRoutes = Router();

// POST /api/users - Create user (register)
userRoutes.post('/',
  validateBody(CreateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.create(req.body);
      // Remove sensitive data
      const { passwordHash, ...safeUser } = user;
      res.status(201).json({ data: safeUser });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/me - Get current user
userRoutes.get('/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.findById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { passwordHash, ...safeUser } = user;
      res.json({ data: safeUser });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/users/me/preferences - Update preferences
userRoutes.patch('/me/preferences',
  authenticate,
  validateBody(UserPreferencesSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updatePreferences(req.userId!, req.body);
      const { passwordHash, ...safeUser } = user;
      res.json({ data: safeUser });
    } catch (error) {
      next(error);
    }
  }
);
