import { CookieOptions, Response } from 'express';
import { config } from '../../config/app.config';
import { calculateExpirationDate } from './date-time';

type CookiePayLoadType = {
	res: Response;
	accessToken: string;
	refreshToken: string;
};

export const REFRESH_PATH = `${config.BASE_PATH}/auth/refresh`;

const defaults: CookieOptions = {
	httpOnly: true,
	secure: config.NODE_ENV === 'production' ? true : false,
	sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
};

export const getRefreshTokenCookieOption = (): CookieOptions => {
	const expiresIn = config.JWT.JWT_REFRESH_EXPIRES_IN;
	const expires = calculateExpirationDate(expiresIn);
	return {
		...defaults,
		expires,
		path: REFRESH_PATH,
	};
};
export const getAccessTokenCookieOption = (): CookieOptions => {
	const expiresIn = config.JWT.EXPIRES_IN;
	const expires = calculateExpirationDate(expiresIn);
	return {
		...defaults,
		expires,
		path: '/',
	};
};

export const setAuthenticationCookies = ({ res, accessToken, refreshToken }: CookiePayLoadType) =>
	res
		.cookie('accessToken', accessToken, getAccessTokenCookieOption())
		.cookie('refreshToken', refreshToken, getRefreshTokenCookieOption());

export const clearAuthenticationCookies = (res: Response): Response =>
	res.clearCookie('accessToken').clearCookie('refreshToken', {
		path: REFRESH_PATH,
	});
