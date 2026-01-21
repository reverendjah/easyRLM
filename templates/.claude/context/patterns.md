# Padroes de Codigo

> **TIER 2 - REFERENCIA**: Carregado quando task envolve criar codigo novo.
> Keywords que ativam: "padrao", "exemplo", "como fazer", "template"

---

## Handler Pattern

```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '@/utils/errors';
import { userService } from '@/services/user';

// Schema de validacao
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

// Handler
export const createUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = CreateUserSchema.parse(req.body);
    const result = await userService.create(input);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
```

---

## Service Pattern

```typescript
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/errors';

interface CreateUserInput {
  name: string;
  email: string;
}

export const userService = {
  async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError('EMAIL_EXISTS', 409);
    }

    return prisma.user.create({
      data: input,
    });
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404);
    }

    return user;
  },
};
```

---

## Error Handling

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message?: string
  ) {
    super(message || code);
    this.name = 'AppError';
  }
}

// Uso
throw new AppError('USER_NOT_FOUND', 404);
throw new AppError('INVALID_INPUT', 400, 'Email is required');
```

---

## Test Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { userService } from '@/services/user';
import { prisma } from '@/lib/prisma';

describe('UserService', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('create', () => {
    it('should create user with valid input', async () => {
      const input = { name: 'Test User', email: 'test@example.com' };

      const result = await userService.create(input);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(input.name);
      expect(result.email).toBe(input.email);
    });

    it('should throw if email already exists', async () => {
      const input = { name: 'Test', email: 'test@example.com' };
      await userService.create(input);

      await expect(userService.create(input)).rejects.toThrow('EMAIL_EXISTS');
    });
  });
});
```

---

## Middleware Pattern

```typescript
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Zod Schema Pattern

```typescript
import { z } from 'zod';

// Base schemas reutilizaveis
const emailSchema = z.string().email();
const idSchema = z.string().uuid();
const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

// Schema composto
export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  role: z.enum(['admin', 'user']).default('user'),
});

// Inferir tipo do schema
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

---

*Ultima atualizacao: {DATA}*
