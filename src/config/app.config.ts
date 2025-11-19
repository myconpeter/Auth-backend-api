import getEnv from '../common/utils/get-env';

const appConfig = () => ({
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  APP_ORIGIN: getEnv('APP_ORIGIN'),
  PORT: getEnv('PORT', '5000'),
  BASE_PATH: getEnv('BASE_PATH', '/api/v1'),
  MONGO_LOCAL_URI: getEnv('MONGO_LOCAL_URI'),
  RESEND_API_KEY: getEnv('RESEND_API_KEY'),
  MAILER_SENDER: getEnv('MAILER_SENDER'),

  JWT: {
    SECRET: getEnv('JWT_SECRET'),
    EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '1h'),
    JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
    JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN'),
  },

  REDIS: {
    HOST: getEnv('REDIS_HOST', 'localhost'),
    PORT: parseInt(getEnv('REDIS_PORT', '6379')),
    PASSWORD: getEnv('REDIS_PASSWORD', ''),
  },

  GOOGLE: {
    CLIENT_ID: getEnv('GOOGLE_CLIENT_ID'),
    CLIENT_SECRET: getEnv('GOOGLE_CLIENT_SECRET'),
    CALLBACK_URL: getEnv(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:5000/api/v1/auth/google/callback'
    ),
  },
});

export const config = appConfig();
