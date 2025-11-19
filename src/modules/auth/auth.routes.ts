import { Router } from 'express';
import { authController } from './auth.module';
import { authenticateJWT } from '../../common/strategy/jwt.strategy';
import passport from '../../middlewares/passport';

const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.post('/verify/email', authController.verifyEmail);
authRoutes.post('/password/forget', authController.forgetPassword);
authRoutes.post('/password/reset', authController.resetPassword);
authRoutes.post('/logout', authenticateJWT, authController.logout);

authRoutes.get('/refresh', authController.refreshToken);

// Google OAuth routes
authRoutes.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

authRoutes.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.APP_ORIGIN}/login?error=oauth_failed`,
  }),
  authController.googleAuthCallback
);

export default authRoutes;
