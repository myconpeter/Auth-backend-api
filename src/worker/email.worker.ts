// src/workers/email.worker.ts
import { emailVerificationQueue } from '../config/queue.config';
import { sendEmail } from '../mailers/mailer';
import { verifyEmailTemplate } from '../mailers/templates/template';
import logger from '../middlewares/logger';

// Process email verification queue
emailVerificationQueue.process('send-verification-email', async job => {
  const { email, verificationUrl } = job.data;

  try {
    logger.info(`Processing email verification for ${email}`);

    const result = await sendEmail({
      to: email,
      ...verifyEmailTemplate(verificationUrl),
    });

    if (!result.data?.id) {
      throw new Error(`Failed to send email: ${result.error}`);
    }

    logger.info(`Verification email sent successfully to ${email}`);

    return {
      success: true,
      emailId: result.data.id,
    };
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    throw error;
  }
});

logger.info('✅ Email worker initialized');
