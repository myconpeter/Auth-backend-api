import jwt from 'jsonwebtoken';
import { config } from '../../config/app.config';

export interface TestUser {
  _id: string;
  email: string;
  name: string;
  password: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createTestUser = (overrides?: Partial<TestUser>): TestUser => {
  return {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const generateTestToken = (
  userId: string,
  sessionId?: string
): string => {
  return jwt.sign(
    {
      userId,
      sessionId: sessionId || 'test-session-id',
    },
    config.JWT.SECRET as jwt.Secret,
    {
      expiresIn: config.JWT.EXPIRES_IN,
      audience: ['user'],
    } as jwt.SignOptions
  );
};

export const mockRequest = (overrides?: any) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    userAgent: 'jest-test',
    ...overrides,
  };
};

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();
