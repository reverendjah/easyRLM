import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
  theme: z.enum(['light', 'dark']).default('light'),
  language: z.string().default('en')
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  passwordHash: z.string(),
  preferences: UserPreferencesSchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8)
});

export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
