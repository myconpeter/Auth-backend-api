import { ErrorCode } from "../../common/enums/error-code.enum";
import { VerificationEnum } from "../../common/enums/verification-code.enum";
import { RegisterDto } from "../../common/interfaces/auth.interface";
import { BadRequestException } from "../../common/utils/catch-errors";
import { fortyMinutesFromNow } from "../../common/utils/date-time";
import UserModel from "../../database/model/user.model";
import VerificationModel from "../../database/model/verification.model";

export class AuthService {
    public async register(registerData: RegisterDto){
        const {name, email, password} = registerData

        const existingUser = await UserModel.exists({email})

        if(existingUser){
            throw new BadRequestException("Email Already Exist", ErrorCode.AUTH_EMAIL_ALREADY_EXISTS)
        }

        const newUser = await UserModel.create({
            name, email,password 
        })
        const userId = newUser._id

        const verificationCode = await VerificationModel.create({
            userId,
            type:VerificationEnum.EMAIL_VERIFICATION,
            expiresAt:fortyMinutesFromNow()


        })
        return {
            user:newUser
        }
    }
}
