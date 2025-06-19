import getEnv from '../common/utils/get-env';

const appConfig = () => ({
	NODE_ENV: getEnv('NODE_ENV', 'development'),
	APP_ORIGIN: getEnv('APP_ORIGIN', 'localhost'),
	PORT: getEnv('PORT', '5000'),
	BASE_PATH: getEnv('BASE_PATH', '/api/v1'),
	MONGO_LOCAL_URI: getEnv('MONGO_LOCAL_URI'),
	RESEND_API_KEY: getEnv('RESEND_API_KEY'),
	MAILER_SENDER: getEnv('MAILER_SENDER'),

	JWT: {
		SECRET: getEnv('JWT_SECRET'),
		EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '1h'),
		JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
		JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN'),
	},
});

export const config = appConfig();
