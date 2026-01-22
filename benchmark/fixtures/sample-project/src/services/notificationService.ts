import { Task } from '../models/Task';
import { userService } from './userService';
import { sendEmail } from '../utils/email';
import { sendPush } from '../utils/push';
import { logger } from '../utils/logger';

export const notificationService = {
  async notifyTaskCreated(task: Task): Promise<void> {
    const user = await userService.findById(task.userId);
    if (!user) {
      logger.warn(`User not found for task notification: ${task.userId}`);
      return;
    }

    if (user.preferences?.emailNotifications) {
      await sendEmail({
        to: user.email,
        subject: 'Task Created',
        body: `Your task "${task.title}" has been created.`
      });
    }

    if (user.preferences?.pushNotifications) {
      await sendPush({
        userId: user.id,
        title: 'Task Created',
        body: task.title
      });
    }
  },

  async notifyTaskCompleted(task: Task): Promise<void> {
    const user = await userService.findById(task.userId);
    if (!user) {
      logger.warn(`User not found for task notification: ${task.userId}`);
      return;
    }

    if (user.preferences?.emailNotifications) {
      await sendEmail({
        to: user.email,
        subject: 'Task Completed',
        body: `Congratulations! You completed "${task.title}".`
      });
    }

    if (user.preferences?.pushNotifications) {
      await sendPush({
        userId: user.id,
        title: 'Task Completed',
        body: `You completed: ${task.title}`
      });
    }
  },

  async notifyTaskDueSoon(task: Task): Promise<void> {
    const user = await userService.findById(task.userId);
    if (!user || !user.preferences?.emailNotifications) return;

    await sendEmail({
      to: user.email,
      subject: 'Task Due Soon',
      body: `Reminder: "${task.title}" is due soon!`
    });
  }
};
