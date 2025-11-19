// src/config/queue.config.ts
import Queue from 'bull';
import { config } from './app.config';
import logger from '../middlewares/logger';

const redisConfig = {
  host: config.REDIS.HOST || 'localhost',
  port: config.REDIS.PORT || 6379,
  password: config.REDIS.PASSWORD || undefined,
};

// Email verification queue
export const emailVerificationQueue = new Queue('email-verification', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// User registration queue (for moving from Redis to DB)
export const userRegistrationQueue = new Queue('user-registration', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue event listeners
emailVerificationQueue.on('completed', job => {
  logger.info(`Email verification job ${job.id} completed`);
});

emailVerificationQueue.on('failed', (job, err) => {
  logger.error(`Email verification job ${job?.id} failed:`, err);
});

userRegistrationQueue.on('completed', job => {
  logger.info(`User registration job ${job.id} completed`);
});

userRegistrationQueue.on('failed', (job, err) => {
  logger.error(`User registration job ${job?.id} failed:`, err);
});

export default {
  emailVerificationQueue,
  userRegistrationQueue,
};
