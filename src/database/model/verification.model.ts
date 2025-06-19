import mongoose, { Document, Schema } from 'mongoose';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import { generateUniqueCode } from '../../common/utils/uuid';

export interface VerificationCodeDocument extends Document {
	userId: mongoose.Types.ObjectId;
	code: string;
	type: VerificationEnum;
	expiresAt: Date;
	createdAt: Date;
}

const verificationSchema = new Schema<VerificationCodeDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	code: { type: String, required: true, unique: true, default: generateUniqueCode },
	type: { type: String, required: true },
	expiresAt: { type: Date, default: new Date() },
	createdAt: { type: Date, required: true, default: new Date(Date.now()) },
});

const VerificationModel = mongoose.model<VerificationCodeDocument>(
	'Verification',
	verificationSchema,
	'verification-codes'
);

export default VerificationModel;
