import passport from 'passport';
import { setupJwtStrategy } from '../common/strategy/jwt.strategy';

const intializePassport = () => {
	setupJwtStrategy(passport);
};

intializePassport();
export default passport;
