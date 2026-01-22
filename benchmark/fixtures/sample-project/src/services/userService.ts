import { User, CreateUserInput, UserPreferences } from '../models/User';
import { AppError } from '../middleware/errorHandler';

// In-memory storage for demo
const users: Map<string, User> = new Map();

export const userService = {
  async findById(id: string): Promise<User | null> {
    return users.get(id) || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(users.values()).find(u => u.email === email) || null;
  },

  async create(data: CreateUserInput): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
      passwordHash: await hashPassword(data.password),
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        theme: 'light',
        language: 'en'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.set(user.id, user);
    return user;
  },

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    const user = users.get(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated: User = {
      ...user,
      preferences: {
        ...user.preferences!,
        ...preferences
      },
      updatedAt: new Date()
    };

    users.set(userId, updated);
    return updated;
  }
};

async function hashPassword(password: string): Promise<string> {
  // Simplified for demo - use bcrypt in production
  return `hashed_${password}`;
}
