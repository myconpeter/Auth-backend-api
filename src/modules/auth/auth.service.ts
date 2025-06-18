import { ErrorCode } from '../../common/enums/error-code.enum';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import { LoginDto, RegisterDto } from '../../common/interfaces/auth.interface';
import { BadRequestException, UnauthorizedException } from '../../common/utils/catch-errors';
import {
	calculateExpirationDate,
	fortyMinutesFromNow,
	ONE_DAY_IN_MS,
} from '../../common/utils/date-time';
import {
	refreshTokenSignOptions,
	RefreshTPayload,
	signJwtToken,
	verifyJwtToken,
} from '../../common/utils/jwt';
import { config } from '../../config/app.config';
import SessionModel from '../../database/model/session.model';
import UserModel from '../../database/model/user.model';
import VerificationModel from '../../database/model/verification.model';
// import jwt from 'jsonwebtoken';
import jwt, { SignOptions } from 'jsonwebtoken';

export class AuthService {
	public async register(registerData: RegisterDto) {
		const { name, email, password } = registerData;

		const existingUser = await UserModel.exists({ email });

		if (existingUser) {
			throw new BadRequestException(
				'Email Already Exist',
				ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
			);
		}

		const newUser = await UserModel.create({
			name,
			email,
			password,
		});
		const userId = newUser._id;

		const verificationCode = await VerificationModel.create({
			userId,
			type: VerificationEnum.EMAIL_VERIFICATION,
			expiresAt: fortyMinutesFromNow(),
		});
		return {
			user: newUser,
		};
	}

	public async login(loginData: LoginDto) {
		const { email, password, userAgent } = loginData;

		const user = await UserModel.findOne({ email });
		if (!user) {
			throw new BadRequestException(
				'Invalid Email or Password',
				ErrorCode.AUTH_USER_NOT_FOUND
			);
		}

		// check if password is the a same as hashed password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			throw new BadRequestException(
				'Invalid Email or Password',
				ErrorCode.AUTH_USER_NOT_FOUND
			);
		}

		const session = await SessionModel.create({
			userId: user._id,
			userAgent,
		});

		const accessToken = signJwtToken({
			userId: user._id,
			sessionId: session._id,
		});

		const refreshToken = signJwtToken(
			{
				sessionId: session._id,
			},
			refreshTokenSignOptions
		);

		return {
			user,
			accessToken,
			refreshToken,
			mfaRequired: false,
		};
	}

	public async refreshToken(refreshToken: string) {
		const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
			secret: refreshTokenSignOptions.secret,
		});

		if (!payload) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		const session = await SessionModel.findById(payload.sessionId);
		const now = Date.now();

		if (!session) {
			throw new UnauthorizedException('Session does not exist');
		}

		if (session.expiredAt.getTime() <= now) {
			throw new UnauthorizedException('Session expired');
		}

		const sessionRequireRefresh = session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;
		if (sessionRequireRefresh) {
			session.expiredAt = calculateExpirationDate(config.JWT.JWT_REFRESH_EXPIRES_IN);
			await session.save();
		}

		const newRefreshToken = sessionRequireRefresh
			? signJwtToken({ sessionId: session._id }, refreshTokenSignOptions)
			: undefined;

		const accessToken = signJwtToken({ sessionId: session._id, userId: session.userId });

		return {
			accessToken,
			newRefreshToken,
		};
	}
}
