import mongoose, { Document, Model, Schema } from 'mongoose';
import { thirtyDaysFromNow } from '../../common/utils/date-time';

export interface SessionDocument extends Document {
	userId: mongoose.Types.ObjectId;
	userAgent?: string;
	expiredAt: Date;
	createdAt: Date;
}

const sessionSchema = new Schema<SessionDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	userAgent: { type: String, required: false },
	createdAt: { type: Date, default: Date.now },
	expiredAt: { type: Date, default: thirtyDaysFromNow, required: true },
});

const SessionModel = mongoose.model<SessionDocument>("Session", sessionSchema)
export default SessionModel