import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  userId: z.string().uuid(),
  dueDate: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
