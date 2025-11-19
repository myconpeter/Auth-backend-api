// src/index.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/app.config';
import connectDB from './database/database';
import errorHandler from './middlewares/errorHandler';
import { asyncHandler } from './middlewares/asyncHandler';
import { applySecurityMiddlewares } from './middlewares/security';
import authRoutes from './modules/auth/auth.routes';
import sessionRoute from './modules/session/session.routes';
import passport from 'passport';
import logger from './middlewares/logger';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import {
  authenticateJWT,
  setupJwtStrategy,
} from './common/strategy/jwt.strategy';
import mfaRoutes from './modules/mfa/mfa.routes';
import redisClient from './config/redis.config';

// Import workers
import './worker/email.worker';
import { setupGoogleStrategy } from './common/strategy/google.strategy';

// import './common/strategy/jwt.strategy';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

const app = express();
const BASE_PATH = config.BASE_PATH;

// Security & basic middlewares
applySecurityMiddlewares(app);

// req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan → Winston logging
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

// Cookie & Passport
app.use(cookieParser());

// IMPORTANT: Setup JWT strategy BEFORE initializing passport
setupJwtStrategy(passport);
setupGoogleStrategy();

app.use(passport.initialize());

// ROUTES
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/mfa`, mfaRoutes);
app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoute);

// Health check
app.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const redisStatus =
      redisClient.status === 'ready' ? 'connected' : 'disconnected';
    res.status(200).json({
      message: 'Welcome subscribers!',
      redis: redisStatus,
    });
  })
);

// Debug route
app.get('/debug-sentry', () => {
  throw new Error('Sentry test error – This should appear in your dashboard!');
});

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn(`404 - ${message} - ${req.method} - ${req.ip}`);
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing HTTP server and Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
      logger.info(`Health check: http://localhost:${PORT}/`);
      logger.info(`Redis: ${redisClient.status}`);
    });
  })
  .catch(err => {
    logger.error('Failed to connect to database', err);
    process.exit(1);
  });
