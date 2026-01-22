// Project Understanding Benchmark - Cross-Module Feature Implementation
import { setMatch, contains, semanticSimilarity } from '../../lib/evaluators.js';

/**
 * Tests ability to understand and modify multi-file projects.
 *
 * This is a practical benchmark for Easy RLM that tests what developers
 * actually care about: can the AI correctly identify all files needed
 * for a cross-cutting feature implementation?
 *
 * Expected: Base Claude ~60% accuracy, Easy RLM >90% accuracy
 */

// Sample project structures for testing
const SAMPLE_PROJECTS = {
  small: {
    name: 'Task Manager API',
    files: [
      { path: 'src/index.ts', type: 'entry', description: 'Express app setup' },
      { path: 'src/routes/tasks.ts', type: 'route', description: 'Task CRUD endpoints' },
      { path: 'src/routes/users.ts', type: 'route', description: 'User auth endpoints' },
      { path: 'src/services/taskService.ts', type: 'service', description: 'Task business logic' },
      { path: 'src/services/userService.ts', type: 'service', description: 'User business logic' },
      { path: 'src/services/notificationService.ts', type: 'service', description: 'Email/push notifications' },
      { path: 'src/models/Task.ts', type: 'model', description: 'Task schema with Zod' },
      { path: 'src/models/User.ts', type: 'model', description: 'User schema with preferences' },
      { path: 'src/models/Notification.ts', type: 'model', description: 'Notification schema' },
      { path: 'src/middleware/auth.ts', type: 'middleware', description: 'JWT validation' },
      { path: 'src/middleware/validation.ts', type: 'middleware', description: 'Request validation' },
      { path: 'src/utils/email.ts', type: 'util', description: 'Sendgrid email wrapper' },
      { path: 'src/utils/push.ts', type: 'util', description: 'Firebase push wrapper' },
      { path: 'src/config/database.ts', type: 'config', description: 'MongoDB connection' },
      { path: 'src/config/env.ts', type: 'config', description: 'Environment variables' },
      { path: 'tests/tasks.test.ts', type: 'test', description: 'Task endpoint tests' },
      { path: 'tests/users.test.ts', type: 'test', description: 'User endpoint tests' },
      { path: 'tests/services/taskService.test.ts', type: 'test', description: 'Task service tests' }
    ],
    patterns: {
      errorHandling: 'AppError class with status codes, caught in error middleware',
      validation: 'Zod schemas in models, validated in middleware',
      authentication: 'JWT tokens, validated in auth middleware',
      testing: 'Vitest with describe/it, mocks for external services'
    }
  }
};

// Generate context from project structure
function generateProjectContext(project) {
  let context = `# Project: ${project.name}\n\n## File Structure\n\n`;

  const byType = {};
  project.files.forEach(f => {
    if (!byType[f.type]) byType[f.type] = [];
    byType[f.type].push(f);
  });

  Object.keys(byType).forEach(type => {
    context += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n`;
    byType[type].forEach(f => {
      context += `- \`${f.path}\`: ${f.description}\n`;
    });
    context += '\n';
  });

  context += `## Patterns\n\n`;
  Object.entries(project.patterns).forEach(([pattern, description]) => {
    context += `- **${pattern}**: ${description}\n`;
  });

  return context;
}

// Generate sample code for files
function generateSampleCode(project) {
  const codeSnippets = [];

  // Task model
  codeSnippets.push({
    file: 'src/models/Task.ts',
    code: `import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  userId: z.string().uuid(),
  dueDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Task = z.infer<typeof TaskSchema>;`
  });

  // User model with preferences
  codeSnippets.push({
    file: 'src/models/User.ts',
    code: `import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
  theme: z.enum(['light', 'dark']).default('light')
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  preferences: UserPreferencesSchema.optional(),
  createdAt: z.date()
});

export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;`
  });

  // Task service
  codeSnippets.push({
    file: 'src/services/taskService.ts',
    code: `import { Task } from '../models/Task';
import { db } from '../config/database';
import { notificationService } from './notificationService';

export class TaskService {
  async create(data: Partial<Task>, userId: string): Promise<Task> {
    const task = await db.tasks.create({ ...data, userId });
    await notificationService.notifyTaskCreated(task);
    return task;
  }

  async complete(taskId: string): Promise<Task> {
    const task = await db.tasks.update(taskId, { status: 'completed' });
    await notificationService.notifyTaskCompleted(task);
    return task;
  }
}`
  });

  // Notification service
  codeSnippets.push({
    file: 'src/services/notificationService.ts',
    code: `import { Task } from '../models/Task';
import { User } from '../models/User';
import { sendEmail } from '../utils/email';
import { sendPush } from '../utils/push';

export class NotificationService {
  async notifyTaskCreated(task: Task): Promise<void> {
    const user = await this.getUser(task.userId);
    if (user.preferences?.emailNotifications) {
      await sendEmail(user.email, 'Task Created', \`Task: \${task.title}\`);
    }
    if (user.preferences?.pushNotifications) {
      await sendPush(user.id, 'Task Created', task.title);
    }
  }

  async notifyTaskCompleted(task: Task): Promise<void> {
    const user = await this.getUser(task.userId);
    if (user.preferences?.emailNotifications) {
      await sendEmail(user.email, 'Task Completed', \`Task: \${task.title}\`);
    }
  }
}`
  });

  return codeSnippets.map(s => `=== ${s.file} ===\n${s.code}`).join('\n\n');
}

// Queries that test cross-module understanding
export const queries = [
  {
    id: 'pu-feature-files-1',
    prompt: 'I want to add user notification preferences (email on/off, push on/off). Which files need to be modified?',
    expected: [
      'src/models/User.ts',
      'src/routes/users.ts',
      'src/services/userService.ts',
      'src/services/notificationService.ts',
      'tests/users.test.ts'
    ],
    evaluator: 'setMatch',
    minScore: 0.8 // At least 80% of files identified
  },
  {
    id: 'pu-feature-files-2',
    prompt: 'To add task sharing between users, what files would need changes?',
    expected: [
      'src/models/Task.ts',
      'src/routes/tasks.ts',
      'src/services/taskService.ts',
      'src/middleware/auth.ts',
      'tests/tasks.test.ts'
    ],
    evaluator: 'setMatch',
    minScore: 0.6
  },
  {
    id: 'pu-pattern-detection-1',
    prompt: 'How does this codebase handle errors?',
    expected: 'AppError class with status codes',
    evaluator: 'contains'
  },
  {
    id: 'pu-pattern-detection-2',
    prompt: 'What validation approach is used in this project?',
    expected: 'Zod schemas',
    evaluator: 'contains'
  },
  {
    id: 'pu-pattern-detection-3',
    prompt: 'How are tests structured in this project?',
    expected: 'Vitest',
    evaluator: 'contains'
  },
  {
    id: 'pu-dependency-analysis-1',
    prompt: 'Which services depend on the User model?',
    expected: ['userService', 'notificationService', 'taskService'],
    evaluator: 'setMatch',
    minScore: 0.66
  },
  {
    id: 'pu-impact-analysis-1',
    prompt: 'If I change the Task schema, what tests might break?',
    expected: ['tasks.test.ts', 'taskService.test.ts'],
    evaluator: 'setMatch',
    minScore: 0.5
  },
  {
    id: 'pu-architecture-1',
    prompt: 'What is the data flow when a user creates a task?',
    expected: 'route -> service -> database -> notification',
    evaluator: 'semanticSimilarity',
    threshold: 0.6
  },
  {
    id: 'pu-config-1',
    prompt: 'Where are environment variables configured?',
    expected: 'src/config/env.ts',
    evaluator: 'contains'
  },
  {
    id: 'pu-testing-1',
    prompt: 'Which files should have corresponding test files but might be missing tests?',
    expected: ['notificationService', 'email', 'push'],
    evaluator: 'setMatch',
    minScore: 0.33
  }
];

export function createBenchmark(options = {}) {
  const project = SAMPLE_PROJECTS.small;
  const context = generateProjectContext(project) + '\n\n## Sample Code\n\n' + generateSampleCode(project);

  return {
    name: 'Project Understanding',
    description: 'Tests ability to understand cross-module dependencies in real projects',
    context,
    queries: queries.map(q => ({
      ...q,
      context: context // Each query gets the full project context
    })),
    evaluate: (query, actual) => {
      switch (query.evaluator) {
        case 'setMatch':
          return setMatch(query.expected, actual, query.minScore);
        case 'contains':
          return contains(query.expected, actual);
        case 'semanticSimilarity':
          return semanticSimilarity(query.expected, actual, query.threshold);
        default:
          return contains(query.expected, actual);
      }
    }
  };
}

export const metadata = {
  name: 'Project Understanding',
  complexity: 'O(N)',
  description: 'Cross-module feature implementation understanding',
  targetImprovement: 'Base ~60% → Easy RLM >90%',
  measuredMetrics: ['files identified', 'patterns detected', 'impact analysis']
};
