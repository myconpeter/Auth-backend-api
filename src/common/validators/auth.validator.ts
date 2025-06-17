import { z } from 'zod';

const emailSchema = z.string().trim().email().min(2).max(255);
const passwordSchema = z.string().trim().min(6).max(255);

const registerSchema = z
	.object({
		name: z.string().trim().min(2).max(255),
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema,
	})
	.refine((val) => val.password === val.confirmPassword, {
		message: 'Password does not match',
		path: ['confirmPassword'],
	});

const loginSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	userAgent: z.string().optional(),
});

export { emailSchema, passwordSchema, registerSchema, loginSchema };
