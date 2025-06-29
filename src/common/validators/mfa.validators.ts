import { z } from 'zod';

const verifyMFASchema = z.object({
	code: z.string().trim().min(1).max(6),
	secretKey: z.string().trim().min(1),
});

const verifyMFAloginSchema = z.object({
	code: z.string().trim().min(1).max(6),
	email: z.string().trim().email().min(1).max(100),
	userAgent: z.string().optional(),
});

export { verifyMFASchema, verifyMFAloginSchema };
