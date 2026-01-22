import { Task, CreateTaskInput, UpdateTaskInput } from '../models/Task';
import { notificationService } from './notificationService';
import { AppError } from '../middleware/errorHandler';

// In-memory storage for demo
const tasks: Map<string, Task> = new Map();

export const taskService = {
  async findAll(userId: string): Promise<Task[]> {
    return Array.from(tasks.values()).filter(t => t.userId === userId);
  },

  async findById(id: string): Promise<Task | null> {
    return tasks.get(id) || null;
  },

  async create(data: CreateTaskInput, userId: string): Promise<Task> {
    const task: Task = {
      id: crypto.randomUUID(),
      ...data,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    tasks.set(task.id, task);
    await notificationService.notifyTaskCreated(task);

    return task;
  },

  async update(id: string, data: UpdateTaskInput): Promise<Task> {
    const task = tasks.get(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updated: Task = {
      ...task,
      ...data,
      updatedAt: new Date()
    };

    tasks.set(id, updated);

    if (data.status === 'completed' && task.status !== 'completed') {
      await notificationService.notifyTaskCompleted(updated);
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    if (!tasks.has(id)) {
      throw new AppError('Task not found', 404);
    }
    tasks.delete(id);
  }
};
