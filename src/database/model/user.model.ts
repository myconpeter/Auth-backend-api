import mongoose, { Document, Schema } from 'mongoose';
import { compareValue, hashValue } from '../../common/utils/bcrypt';

interface UserPreference {
	enable2FA: boolean;
	emailNotification: boolean;
	twoFactor?: string;
}

export interface UserDocument extends Document {
	name: string;
	email: string;
	password: string;
	isEmailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
	userPreferences: UserPreference;
	comparePassword(value: string): Promise<boolean>;
}

const userPreferenceSchema = new Schema<UserPreference>({
	enable2FA: { type: Boolean, default: false },
	emailNotification: { type: Boolean, default: true },
	twoFactor: { type: String, required: false },
});

const userSchema = new Schema<UserDocument>(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		isEmailVerified: { type: Boolean, default: false },
		userPreferences: {
			type: userPreferenceSchema,
			default: {},
		},
	},
	{ timestamps: true, toJSON: {} }
);

userSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await hashValue(this.password);
	}
	next();
});

userSchema.methods.comparePassword = async function (value: string) {
	return compareValue(value, this.password);
};

userSchema.set('toJSON', {
	transform: function (doc, ret) {
		delete ret.password;
		delete ret.userPreferences.twoFactor;
		return ret;
	},
});

const UserModel = mongoose.model<UserDocument>('User', userSchema);
export default UserModel;
