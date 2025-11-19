// src/common/strategy/google.strategy.ts
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { config } from '../../config/app.config';
import UserModel from '../../database/model/user.model';
import logger from '../../middlewares/logger';

export const setupGoogleStrategy = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE.CLIENT_ID,
        clientSecret: config.GOOGLE.CLIENT_SECRET,
        callbackURL: config.GOOGLE.CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          logger.info(
            `Google OAuth login attempt for email: ${profile.emails?.[0]?.value}`
          );

          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const name = profile.displayName;
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), false);
          }

          // Check if user exists by email
          let user = await UserModel.findOne({ email });

          if (user) {
            // User exists - update Google ID if not set
            if (!user.googleId) {
              user.googleId = googleId;
              user.isEmailVerified = true; // Google emails are verified
              if (avatar && !user.avatar) {
                user.avatar = avatar;
              }
              await user.save();
            }
            logger.info(`Existing user logged in via Google: ${email}`);
          } else {
            // Create new user
            user = await UserModel.create({
              name,
              email,
              googleId,
              avatar,
              isEmailVerified: true, // Google emails are pre-verified
              password: Math.random().toString(36).slice(-8), // Random password (won't be used)
            });
            logger.info(`New user created via Google: ${email}`);
          }

          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error as Error, false);
        }
      }
    )
  );
};
