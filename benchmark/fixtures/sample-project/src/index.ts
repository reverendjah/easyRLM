import express from 'express';
import { taskRoutes } from './routes/tasks';
import { userRoutes } from './routes/users';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config/env';

const app = express();

app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

export { app };
