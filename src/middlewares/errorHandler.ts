import { ErrorRequestHandler } from 'express';
import { HTTPSTATUS } from '../config/http.config';
import AppError from '../common/utils/AppError';

const errorHandler: ErrorRequestHandler = (error, req, res, next): any => {
	console.error(`Error Occurred on PATH ${req.path}`);

	if (error instanceof SyntaxError) {
		return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: 'Invalid Request Body' });
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
