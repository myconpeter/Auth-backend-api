import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '../../.env.test') });

// Set required environment variables for testing
process.env.NODE_ENV = 'test';
process.env.APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || '30d';
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.MONGO_LOCAL_URI = 'mongodb://localhost:27017/test-db';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test-db';
process.env.BASE_PATH = process.env.BASE_PATH || '/api/v1';
process.env.PORT = process.env.PORT || '3001';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test-key';
process.env.MAILER_SENDER = process.env.MAILER_SENDER || 'test-key';
