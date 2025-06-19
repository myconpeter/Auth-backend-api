import { Resend } from 'resend';
import { config } from '../config/app.config';

export const resend = new Resend(config.RESEND_API_KEY);
