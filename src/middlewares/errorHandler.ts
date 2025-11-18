import { ErrorRequestHandler, Response } from 'express';
import { HTTPSTATUS } from '../config/http.config';
import AppError from '../common/utils/AppError';
import { z } from 'zod';
import {
  clearAuthenticationCookies,
  REFRESH_PATH,
} from '../common/utils/cookies';
import { config } from '../config/app.config';

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  return res
    .status(HTTPSTATUS.BAD_REQUEST)
    .json({ message: 'Validation Failed', errors: errors });
};

const errorHandler: ErrorRequestHandler = (error, req, res, next): any => {
  config.NODE_ENV === 'production' || config.NODE_ENV === 'test'
    ? ''
    : console.error(`Error Occurred on PATH ${req.path}`, error);

  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res);
  }

  if (error instanceof SyntaxError) {
    return res
      .status(HTTPSTATUS.BAD_REQUEST)
      .json({ message: 'Invalid Request Body' });
  }

  if (error instanceof z.ZodError) {
    return formatZodError(res, error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }
  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: 'Internal Server Error',
    error: error.message || 'Unknown Error',
  });
};

export default errorHandler;
