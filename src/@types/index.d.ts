import { UserDocument } from '../database/model/user.model';

declare global {
	namespace Express {
		interface User extends UserDocument {}
		interface Request {
			sessionId?: string;
		}
	}
}
