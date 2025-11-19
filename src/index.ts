import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
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

// src/index.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { HTTPSTATUS } from './config/http.config';
import { authenticateJWT } from './common/strategy/jwt.strategy';
import mfaRoutes from './modules/mfa/mfa.routes';

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
app.use(passport.initialize());

// ROUTES
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/mfa`, mfaRoutes);

app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoute);

// Health check
app.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome subscribers!' });
  })
);

// Debug route (remove or protect in production!)
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

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
      logger.info(`Health check: http://localhost:${PORT}/`);
    });
  })
  .catch(err => {
    logger.error('Failed to connect to database', err);
    process.exit(1);
  });
