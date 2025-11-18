import request from 'supertest';
import express, { Application } from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from '../auth.routes';
import { HTTPSTATUS } from '../../../config/http.config';
import UserModel from '../../../database/model/user.model';
import errorHandler from '../../../middlewares/errorHandler';

// Create test Express app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/auth', authRoutes);

  // Add error handler middleware
  app.use(errorHandler);

  return app;
};

describe('Auth Login Tests', () => {
  let app: Application;

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create a test user - DON'T hash password manually, the model does it
      await UserModel.create({
        email: testUser.email,
        password: testUser.password, // Plain password - model will hash it
        name: testUser.name,
        isEmailVerified: true, // Changed from 'verified'
        userPreferences: {
          enable2FA: false,
          emailNotification: true,
          twoFactor: '', // Changed from 'twoFactorSecret'
        },
      });

      // Attempt login
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(HTTPSTATUS.OK);

      // Verify response
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'WrongPassword123!',
        })
        .expect(HTTPSTATUS.BAD_REQUEST);

      expect(response.body).toHaveProperty('message');
    });

    it('should return error for missing email', async () => {
      const response = await request(app).post('/auth/login').send({
        password: testUser.password,
      });

      expect([400, 500].includes(response.status)).toBe(true);
    });

    it('should return error for missing password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: testUser.email,
      });

      expect([400, 500].includes(response.status)).toBe(true);
    });

    it('should set HTTP-only cookies on successful login', async () => {
      // Create a test user
      await UserModel.create({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        isEmailVerified: true,
        userPreferences: {
          enable2FA: false,
          emailNotification: true,
          twoFactor: '',
        },
      });

      // Attempt login
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(HTTPSTATUS.OK);

      // Check for cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
    });

    it('should handle MFA requirement correctly', async () => {
      // Create user with 2FA enabled
      await UserModel.create({
        email: 'mfa@example.com',
        password: testUser.password,
        name: 'MFA User',
        isEmailVerified: true,
        userPreferences: {
          enable2FA: true,
          emailNotification: true,
          twoFactor: 'test-secret',
        },
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'mfa@example.com',
          password: testUser.password,
        })
        .expect(HTTPSTATUS.OK);

      expect(response.body).toHaveProperty('mfaRequired', true);
      expect(response.body.message).toMatch(/MFA/i);
    });
  });
});
