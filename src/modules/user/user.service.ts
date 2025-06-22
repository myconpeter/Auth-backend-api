import UserModel from '../../database/model/user.model';

class UserService {
	public async findUserById(userId: string) {
		const user = await UserModel.findById(userId, {
			password: false,
		});

		return user || null;
	}
}

export { UserService };
