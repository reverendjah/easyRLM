import { Router, Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { CreateTaskSchema, UpdateTaskSchema } from '../models/Task';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const taskRoutes = Router();

// All task routes require authentication
taskRoutes.use(authenticate);

// GET /api/tasks - List all tasks for user
taskRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.findAll(req.userId!);
    res.json({ data: tasks });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id - Get single task
taskRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.findById(req.params.id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    if (task.userId !== req.userId) {
      throw new AppError('Forbidden', 403);
    }
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Create task
taskRoutes.post('/',
  validateBody(CreateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.create(req.body, req.userId!);
      res.status(201).json({ data: task });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/tasks/:id - Update task
taskRoutes.patch('/:id',
  validateBody(UpdateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await taskService.findById(req.params.id);
      if (!existing) {
        throw new AppError('Task not found', 404);
      }
      if (existing.userId !== req.userId) {
        throw new AppError('Forbidden', 403);
      }

      const task = await taskService.update(req.params.id, req.body);
      res.json({ data: task });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/tasks/:id - Delete task
taskRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await taskService.findById(req.params.id);
    if (!existing) {
      throw new AppError('Task not found', 404);
    }
    if (existing.userId !== req.userId) {
      throw new AppError('Forbidden', 403);
    }

    await taskService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
