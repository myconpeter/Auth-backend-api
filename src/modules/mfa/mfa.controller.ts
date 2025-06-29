import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { MfaService } from './mfa.services';
import { HTTPSTATUS } from '../../config/http.config';
import { verifyMFAloginSchema, verifyMFASchema } from '../../common/validators/mfa.validators';
import { setAuthenticationCookies } from '../../common/utils/cookies';

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

	public revokeMFA = asyncHandler(async (req: Request, res: Response) => {
		const { message, userPreferences } = await this.mfaService.revokeMFA(req);

		res.status(HTTPSTATUS.OK).json({
			message,
			userPreferences,
		});
	});

	public verifyMFAlogin = asyncHandler(async (req: Request, res: Response) => {
		const { code, email, userAgent } = verifyMFAloginSchema.parse({
			...req.body,
			userAgent: req.headers['user-agent'],
		});
		const { user, accessToken, refreshToken } = await this.mfaService.verifyMFAlogin(
			code,
			email,
			userAgent
		);

		return setAuthenticationCookies({ res, accessToken, refreshToken })
			.status(HTTPSTATUS.OK)
			.json({
				message: 'Verified and login',
				user,
			});
	});
}
