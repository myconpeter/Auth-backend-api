import { ErrorCode } from '../../common/enums/error-code.enum';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import { LoginDto, RegisterDto, resetPasswordDto } from '../../common/interfaces/auth.interface';
import {
	BadRequestException,
	HttpException,
	NotFoundException,
	UnauthorizedException,
} from '../../common/utils/catch-errors';
import {
	anHourFromNow,
	calculateExpirationDate,
	fortyMinutesFromNow,
	ONE_DAY_IN_MS,
	threeMinutesAgo,
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
import { sendEmail } from '../../mailers/mailer';
import { passwordResetTemplate, verifyEmailTemplate } from '../../mailers/templates/template';
import { HTTPSTATUS } from '../../config/http.config';
import { hashValue } from '../../common/utils/bcrypt';

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

		const sendVerificationEmail = await VerificationModel.create({
			userId,
			type: VerificationEnum.EMAIL_VERIFICATION,

			expiresAt: fortyMinutesFromNow(),
		});

		// send verification email

		const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${sendVerificationEmail.code}`;

		await sendEmail({
			to: newUser.email,

			...verifyEmailTemplate(verificationUrl),
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

	public async verifyEmail(code: string) {
		const verificationCode = await VerificationModel.findOne({
			code: code,
			type: VerificationEnum.EMAIL_VERIFICATION,
			expiresAt: { $gt: new Date() },
		});

		if (!verificationCode) {
			throw new BadRequestException('Invalid or expired Verification Code');
		}

		const updatedUser = await UserModel.findByIdAndUpdate(
			verificationCode.userId,
			{ isEmailVerified: true },
			{ new: true }
		);

		if (!updatedUser) {
			throw new BadRequestException('Unable to verify Email Address');
		}

		await verificationCode.deleteOne();
		return {
			user: updatedUser,
		};
	}

	public async forgetPassword(email: string) {
		const user = await UserModel.findOne({ email });

		if (!user) {
			throw new NotFoundException('User Not Found');
		}

		// wow rate limiting 2 email per 2 or 10 min

		const timeAgo = threeMinutesAgo();
		const maxAttempts = 2;

		const count: number = await VerificationModel.countDocuments({
			userId: user._id,
			type: VerificationEnum.PASSWORD_RESET,
			createdAt: { $gt: timeAgo },
		});

		if (count >= maxAttempts) {
			throw new HttpException(
				'Too many request, Please try again later',
				HTTPSTATUS.TOO_MANY_REQUEST,
				ErrorCode.AUTH_TOO_MANY_ATTEMPTS
			);
		}

		const expiresAt = anHourFromNow();
		const validCode = await VerificationModel.create({
			userId: user._id,
			type: VerificationEnum.PASSWORD_RESET,
			expiresAt,
		});

		const resetLink = `${config.APP_ORIGIN}/reset-password?code=${
			validCode.code
		}&exp=${expiresAt.getTime()}`;

		const { data, error } = await sendEmail({
			to: user.email,
			...passwordResetTemplate(resetLink),
		});

		if (!data?.id) {
			throw new BadRequestException(`Cannot send ${error}`);
		}

		return {
			url: resetLink,
			emailId: data.id,
		};
	}

	public async resetPassword({ password, verificationCode }: resetPasswordDto) {
		const validCode = await VerificationModel.findOne({
			code: verificationCode,
			type: VerificationEnum.PASSWORD_RESET,
			expiresAt: { $gt: new Date() },
		});

		if (!validCode) {
			throw new NotFoundException('Invalid Credentials');
		}

		const hashedPassword = await hashValue(password);

		const updatedPassword = await UserModel.findByIdAndUpdate(validCode.userId, {
			password: hashedPassword,
		});

		if (!updatedPassword) {
			throw new BadRequestException('Failed to reset password');
		}

		await validCode.deleteOne();
		await SessionModel.deleteMany({ userId: updatedPassword._id });

		return {
			updatedPassword,
		};
	}

	public async logout(sessionId: string) {
		return await SessionModel.findByIdAndDelete(sessionId);
	}
}
