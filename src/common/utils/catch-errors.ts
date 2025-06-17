import { HTTPSTATUS, HttpStatusCode } from '../../config/http.config';
import { ErrorCode } from '../enums/error-code.enum';
import AppError from './AppError';

class NotFoundException extends AppError {
	constructor(message: string = 'Resourse Not Found', errorCode?: ErrorCode) {
		super(message, HTTPSTATUS.NOT_FOUND, errorCode || ErrorCode.RESOURCE_NOT_FOUND);
	}
}
class BadRequestException extends AppError {
	constructor(message: string = 'Bad Request', errorCode?: ErrorCode) {
		super(message, HTTPSTATUS.BAD_REQUEST, errorCode);
	}
}
class UnauthorizedException extends AppError {
	constructor(message: string = 'Unauthorized', errorCode?: ErrorCode) {
		super(message, HTTPSTATUS.UNAUTHORIZED, errorCode);
	}
}

class HttpException extends AppError {
	constructor(
		message = 'Http Exception Error',
		statusCode: HttpStatusCode,
		errorCode: ErrorCode
	) {
		super(message, statusCode, errorCode);
	}
}

export { NotFoundException, BadRequestException, UnauthorizedException, HttpException  };
