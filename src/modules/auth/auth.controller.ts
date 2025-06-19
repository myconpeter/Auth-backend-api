import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { AuthService } from './auth.service';
import { HTTPSTATUS } from '../../config/http.config';
import {
	emailSchema,
	loginSchema,
	registerSchema,
	resetPasswordSchema,
	verificationEmailSchema,
} from '../../common/validators/auth.validator';
import {
	getAccessTokenCookieOption,
	getRefreshTokenCookieOption,
	setAuthenticationCookies,
} from '../../common/utils/cookies';
import { UnauthorizedException } from '../../common/utils/catch-errors';
import { ErrorCode } from '../../common/enums/error-code.enum';

export class AuthController {
	private authService: AuthService;

	constructor(authService: AuthService) {
		this.authService = authService;
	}

	public register = asyncHandler(async (req: Request, res: Response): Promise<any> => {
		const body = registerSchema.parse({ ...req.body });
		const { user } = await this.authService.register(body);

		return res.status(HTTPSTATUS.CREATED).json({
			message: 'User Created',
			data: user,
		});
	});

	public login = asyncHandler(async (req: Request, res: Response): Promise<any> => {
		const userAgent = req.headers['user-agent'];
		const body = loginSchema.parse({ ...req.body, userAgent });

		const { user, accessToken, refreshToken, mfaRequired } = await this.authService.login(body);
		return setAuthenticationCookies({ res, accessToken, refreshToken })
			.status(HTTPSTATUS.OK)
			.json({
				message: 'User Login Successfully',
				mfaRequired,
				user,
			});
	});

	public refreshToken = asyncHandler(async (req: Request, res: Response): Promise<any> => {
		const refreshToken = req.cookies.refreshToken as string | undefined;
		if (!refreshToken) {
			throw new UnauthorizedException(
				'Authorization not permitted',
				ErrorCode.ACCESS_FORBIDDEN
			);
		}

		const { accessToken, newRefreshToken } = await this.authService.refreshToken(refreshToken);

		if (newRefreshToken) {
			res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOption());
		}

		return res
			.status(HTTPSTATUS.OK)
			.cookie('accessToken', accessToken, getAccessTokenCookieOption())
			.json({
				message: 'Refresh Access Token Successfully',
			});
	});

	public verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<any> => {
		const { code } = verificationEmailSchema.parse(req.body);

		await this.authService.verifyEmail(code);

		return res.status(HTTPSTATUS.OK).json({
			message: 'Email Verified Successfully',
		});
	});

	public forgetPassword = asyncHandler(async (req: Request, res: Response): Promise<any> => {
		const email = emailSchema.parse(req.body.email);
		await this.authService.forgetPassword(email);

		return res.status(HTTPSTATUS.OK).json({
			message: 'Password Reset Link Sent',
		});
	});
}
