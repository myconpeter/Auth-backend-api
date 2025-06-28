import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { MfaService } from './mfa.services';
import { HTTPSTATUS } from '../../config/http.config';
import { verifyMFASchema } from '../../common/validators/mfa.validators';

export class MfaController {
	private mfaService: MfaService;

	constructor(mfaService: MfaService) {
		this.mfaService = mfaService;
	}

	public generateMFASetup = asyncHandler(async (req: Request, res: Response): Promise<any> => {
		const { message, secret, qrImageUrl } = await this.mfaService.generateMFASetup(req);

		return res.status(HTTPSTATUS.OK).json({
			message,
			secret,
			qrImageUrl,
		});
	});

	public verifyMFASetup = asyncHandler(async (req: Request, res: Response): Promise<any> => {
		const { code, secretKey } = verifyMFASchema.parse({ ...req.body });

		const { message, userPreferences } = await this.mfaService.verifyMFASetup(
			req,
			code,
			secretKey
		);

		res.status(HTTPSTATUS.OK).json({
			message: message,
			userPreferences: userPreferences,
		});
	});
}
