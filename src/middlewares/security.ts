// src/middlewares/security.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import compression from 'compression';
import { Application } from 'express';

export function applySecurityMiddlewares(app: Application) {
  app.enable('trust proxy');
  app.disable('x-powered-by');

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
    })
  );

  // CORS
  const allowedOrigins = [
    'https://whudey.com',
    'https://www.whudey.com',
    'http://localhost:3000', // dev
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

  app.use(hpp());
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', limiter); // Apply only to /api routes

  // Body parsing should come AFTER security middlewares
  //   app.use(express.json({ limit: '10mb' }));
  //   app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}
