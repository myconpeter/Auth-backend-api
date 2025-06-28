import { Request } from 'express';
import {
	BadRequestException,
	NotFoundException,
	UnauthorizedException,
} from '../../common/utils/catch-errors';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export class MfaService {
	public async generateMFASetup(req: Request) {
		const user = req.user;

		if (!user) {
			throw new UnauthorizedException('user not authorized');
		}

		if (user.userPreferences.enable2FA) {
			return {
				message: 'user mfa already activated',
			};
		}

		let secretKey = user.userPreferences.twoFactor;
		if (!secretKey) {
			const secret = speakeasy.generateSecret({ name: 'Squeezy' });
			secretKey = secret.base32;
			user.userPreferences.twoFactor = secretKey;
			await user.save();
		}

		const url = speakeasy.otpauthURL({
			secret: secretKey,
			label: `${user.email}`,
			issuer: 'squeezy.com',
			encoding: 'base32',
		});

		const qrImageUrl = await qrcode.toDataURL(url);

		return {
			message: 'Scan the qrcode or user the setup key',
			secret: secretKey,
			qrImageUrl,
		};
	}

	public async verifyMFASetup(req: Request, code: string, secretKey: string) {
		const user = req.user;
		if (!user) {
			throw new NotFoundException('User Not Found...');
		}

		if (user.userPreferences.enable2FA) {
			return {
				message: 'MFA already enabled...',
				userPreferences: {
					enable2FA: user.userPreferences.enable2FA,
				},
			};
		}

		const isValid = speakeasy.totp.verify({
			secret: secretKey,
			encoding: 'base32',
			token: code,
		});

		if (!isValid) {
			throw new BadRequestException('Invalid Valid Code');
		}
		user.userPreferences.enable2FA = true;
		await user.save();

		return {
			message: 'MFA already enabled...',
			userPreferences: {
				enable2FA: user.userPreferences.enable2FA,
			},
		};
	}
}
