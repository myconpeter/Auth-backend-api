import { NextFunction, Request, Response } from 'express';

type AuthControllerType = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler =
	(controller: AuthControllerType) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			await controller(req, res, next);
		} catch (error) {
			next(error);
		}
	};
