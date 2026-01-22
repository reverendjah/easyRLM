import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskService } from '../src/services/taskService';

// Mock notification service
vi.mock('../src/services/notificationService', () => ({
  notificationService: {
    notifyTaskCreated: vi.fn(),
    notifyTaskCompleted: vi.fn()
  }
}));

describe('taskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task with valid data', async () => {
      const task = await taskService.create({
        title: 'Test Task',
        status: 'pending',
        userId: 'user-123'
      }, 'user-123');

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('pending');
    });

    it('should set createdAt and updatedAt dates', async () => {
      const before = new Date();
      const task = await taskService.create({
        title: 'Test Task',
        status: 'pending',
        userId: 'user-123'
      }, 'user-123');
      const after = new Date();

      expect(task.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(task.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('findById', () => {
    it('should return null for non-existent task', async () => {
      const task = await taskService.findById('non-existent');
      expect(task).toBeNull();
    });
  });

  describe('update', () => {
    it('should throw error for non-existent task', async () => {
      await expect(
        taskService.update('non-existent', { title: 'Updated' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('delete', () => {
    it('should throw error for non-existent task', async () => {
      await expect(
        taskService.delete('non-existent')
      ).rejects.toThrow('Task not found');
    });
  });
});
