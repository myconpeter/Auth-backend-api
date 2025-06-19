import { add } from 'date-fns';

export const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export const thirtyDaysFromNow = (): Date => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export const fortyMinutesFromNow = (): Date => new Date(Date.now() + 40 * 60 * 1000);

export const anHourFromNow = (): Date => new Date(Date.now() + 60 * 60 * 1000);

export const calculateExpirationDate = (expires: string = '15m') => {
	const match = expires.match(/^(\d+)([mhd])$/);
	if (!match) {
		throw new Error('Invalid format of expiredAt');
	}

	const [, value, unit] = match;
	const expirationDate = new Date();

	switch (unit) {
		case 'm':
			return add(expirationDate, { minutes: parseInt(value) });
		case 'h':
			return add(expirationDate, { hours: parseInt(value) });
		case 'd':
			return add(expirationDate, { days: parseInt(value) });

		default:
			throw new Error('Invalid Unit');
	}
};

export const threeMinutesAgo = (): Date => new Date(Date.now() - 3 * 60 * 1000);
