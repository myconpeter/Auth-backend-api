import { config } from '../config/app.config';
import { resend } from './resendClient';

const mailer_sender =
	config.NODE_ENV === 'development'
		? `no-reply <onboarding@resend.dev>`
		: `no-reply <${config.MAILER_SENDER}>`;

type Params = {
	to: string | string[];
	subject: string;
	text: string;
	html: string;
	from?: string;
};

export const sendEmail = async ({ to, from = mailer_sender, subject, text, html }: Params) => {
	return await resend.emails.send({
		from,
		to: Array.isArray(to) ? to : to,
		text,
		subject,
		html,
	});
};
