import { Router } from 'express';
import { authController } from './auth.module';
import { authenticateJWT } from '../../common/strategy/jwt.strategy';

const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.post('/verify/email', authController.verifyEmail);
authRoutes.post('/password/forget', authController.forgetPassword);
authRoutes.post('/password/reset', authController.resetPassword);
authRoutes.post('/logout', authenticateJWT, authController.logout);

authRoutes.get('/refresh', authController.refreshToken);

export default authRoutes;
