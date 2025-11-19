// src/config/redis.config.ts
import Redis from 'ioredis';
import { config } from './app.config';
import logger from '../middlewares/logger';

const redisClient = new Redis({
  host: config.REDIS.HOST || 'localhost',
  port: config.REDIS.PORT || 6379,
  password: config.REDIS.PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  logger.info('✅ Redis client connected');
});

redisClient.on('error', err => {
  logger.error('❌ Redis Client Error', err);
});

redisClient.on('ready', () => {
  logger.info('🚀 Redis client ready to use');
});

export default redisClient;
