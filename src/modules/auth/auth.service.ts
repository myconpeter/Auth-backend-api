// src/modules/auth/auth.service.ts
import { ErrorCode } from '../../common/enums/error-code.enum';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import {
  LoginDto,
  RegisterDto,
  resetPasswordDto,
} from '../../common/interfaces/auth.interface';
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
import jwt, { SignOptions } from 'jsonwebtoken';
import { sendEmail } from '../../mailers/mailer';
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from '../../mailers/templates/template';
import { HTTPSTATUS } from '../../config/http.config';
import { hashValue } from '../../common/utils/bcrypt';
import redisClient from '../../config/redis.config';
import { emailVerificationQueue } from '../../config/queue.config';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../middlewares/logger';

export class AuthService {
  public async register(registerData: RegisterDto) {
    const { name, email, password } = registerData;

    // Check if user already exists in DB
    const existingUser = await UserModel.exists({ email });
    if (existingUser) {
      throw new BadRequestException(
        'Email Already Exist',
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }

    // Check if user already in Redis (pending verification)
    const pendingUser = await redisClient.get(`pending:user:${email}`);
    if (pendingUser) {
      throw new BadRequestException(
        'Registration pending. Please verify your email.',
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }

    // Generate verification code
    const verificationCode = uuidv4();
    const expiresAt = fortyMinutesFromNow();

    // Store user data in Redis with verification code
    const userData = {
      name,
      email,
      password: password,
      verificationCode,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Store in Redis with 45-minute expiration
    await redisClient.setex(
      `pending:user:${email}`,
      60 * 45, // 45 minutes
      JSON.stringify(userData)
    );

    // Also store by verification code for easy lookup
    await redisClient.setex(
      `verification:code:${verificationCode}`,
      60 * 45,
      email
    );

    // Send verification email via queue
    const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${verificationCode}`;

    await emailVerificationQueue.add('send-verification-email', {
      email,
      verificationUrl,
    });

    logger.info(`User registration initiated for ${email}`);

    return {
      user: {
        name,
        email,
        message: 'Please check your email to verify your account',
      },
    };
  }

  public async login(loginData: LoginDto) {
    const { email, password, userAgent } = loginData;

    // Check if user is still in Redis (not verified)
    const pendingUser = await redisClient.get(`pending:user:${email}`);
    if (pendingUser) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new BadRequestException(
        'Invalid Email or Password',
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // Check if password is valid
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new BadRequestException(
        'Invalid Email or Password',
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // Check if user enabled 2FA
    if (user.userPreferences.enable2FA) {
      return {
        user,
        accessToken: '',
        refreshToken: '',
        mfaRequired: true,
      };
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

    const sessionRequireRefresh =
      session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;

    if (sessionRequireRefresh) {
      session.expiredAt = calculateExpirationDate(
        config.JWT.JWT_REFRESH_EXPIRES_IN
      );
      await session.save();
    }

    const newRefreshToken = sessionRequireRefresh
      ? signJwtToken({ sessionId: session._id }, refreshTokenSignOptions)
      : undefined;

    const accessToken = signJwtToken({
      sessionId: session._id,
      userId: session.userId,
    });

    return {
      accessToken,
      newRefreshToken,
    };
  }

  public async handleGoogleOAuth(user: any, userAgent: string) {
    // Check if user enabled 2FA (unlikely for OAuth but just in case)
    if (user.userPreferences?.enable2FA) {
      return {
        user,
        accessToken: '',
        refreshToken: '',
        mfaRequired: true,
      };
    }

    // Create session
    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    // Generate tokens
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

    logger.info(`Google OAuth login successful for user: ${user.email}`);

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
    };
  }

  public async verifyEmail(code: string) {
    // Get email from verification code in Redis
    const email = await redisClient.get(`verification:code:${code}`);

    if (!email) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Get user data from Redis
    const userDataStr = await redisClient.get(`pending:user:${email}`);

    if (!userDataStr) {
      throw new BadRequestException(
        'Verification expired. Please register again.'
      );
    }

    const userData = JSON.parse(userDataStr);

    // Check if verification code matches
    if (userData.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Check expiration
    if (new Date(userData.expiresAt) < new Date()) {
      // Clean up expired data
      await redisClient.del(`pending:user:${email}`);
      await redisClient.del(`verification:code:${code}`);
      throw new BadRequestException(
        'Verification code expired. Please register again.'
      );
    }

    // Create user in database
    const newUser = await UserModel.create({
      name: userData.name,
      email: userData.email,
      password: userData.password, // Already hashed
      isEmailVerified: true,
    });

    // Clean up Redis
    await redisClient.del(`pending:user:${email}`);
    await redisClient.del(`verification:code:${code}`);

    logger.info(`User ${email} verified and saved to database`);

    return {
      user: newUser,
    };
  }

  public async forgetPassword(email: string) {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // Rate limiting: 2 emails per 3 minutes
    const timeAgo = threeMinutesAgo();
    const maxAttempts = 2;

    const count: number = await VerificationModel.countDocuments({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      createdAt: { $gt: timeAgo },
    });

    if (count >= maxAttempts) {
      throw new HttpException(
        'Too many requests. Please try again later',
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
      throw new BadRequestException(`Cannot send email: ${error}`);
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
      throw new NotFoundException('Invalid or expired verification code');
    }

    const hashedPassword = await hashValue(password);

    const updatedPassword = await UserModel.findByIdAndUpdate(
      validCode.userId,
      {
        password: hashedPassword,
      }
    );

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
