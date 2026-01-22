import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userService } from '../src/services/userService';

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user with valid data', async () => {
      const user = await userService.create({
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'securePassword123'
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('securePassword123');
    });

    it('should set default preferences', async () => {
      const user = await userService.create({
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'securePassword123'
      });

      expect(user.preferences).toBeDefined();
      expect(user.preferences?.emailNotifications).toBe(true);
      expect(user.preferences?.pushNotifications).toBe(false);
      expect(user.preferences?.theme).toBe('light');
    });
  });

  describe('findById', () => {
    it('should return null for non-existent user', async () => {
      const user = await userService.findById('non-existent');
      expect(user).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should throw error for non-existent user', async () => {
      await expect(
        userService.updatePreferences('non-existent', { theme: 'dark' })
      ).rejects.toThrow('User not found');
    });
  });
});
