// src/middlewares/security.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import compression from 'compression';
import { Application } from 'express';

export function applySecurityMiddlewares(app: Application) {
  // IMPORTANT: Set trust proxy to a number instead of 'true'
  // 1 = trust first proxy (Cloudflare, nginx, etc.)
  // Adjust based on your infrastructure
  app.set('trust proxy', 1);
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
    'https://stockinvest.online',
    'https://www.stockinvest.online/',
    'http://localhost:3000',
    'https://squeezy-frontend.vercel.app',
    // dev
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

  // Rate limiting with proper validation configuration
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    // Disable the strict trust proxy validation
    validate: {
      trustProxy: false,
      xForwardedForHeader: false,
    },
  });
  app.use('/api/', limiter); // Apply only to /api routes
}
