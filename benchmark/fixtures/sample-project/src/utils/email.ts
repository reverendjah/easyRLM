import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In production, use SendGrid, SES, etc.
  logger.info(`Sending email to ${options.to}: ${options.subject}`);

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  // For demo, just log and return success
  logger.debug('Email sent successfully', { to: options.to });
  return true;
}

export async function sendBulkEmail(emails: EmailOptions[]): Promise<number> {
  let sent = 0;
  for (const email of emails) {
    const success = await sendEmail(email);
    if (success) sent++;
  }
  return sent;
}
