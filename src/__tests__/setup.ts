// src/__tests__/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import redisClient from '../config/redis.config';
import { emailVerificationQueue } from '../config/queue.config';
// Import any Bull queues you have

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory MongoDB for testing');

    if (redisClient.status !== 'ready') {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Failed to connect:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    if (redisClient.status === 'ready') {
      await redisClient.flushdb();
    }
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
});

afterAll(async () => {
  try {
    // Close Bull queues first
    if (emailVerificationQueue) {
      await emailVerificationQueue.close();
    }

    // Close MongoDB
    await mongoose.disconnect();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }

    // Close Redis
    if (redisClient.status === 'ready') {
      await redisClient.quit();
    }

    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Failed to disconnect:', error);
  }
});

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};
