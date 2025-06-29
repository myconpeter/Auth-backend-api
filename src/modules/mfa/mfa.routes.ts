import { Router } from 'express';
import { authenticateJWT } from '../../common/strategy/jwt.strategy';
import { mfaController } from './mfa.module';

const mfaRoutes = Router();

mfaRoutes.get('/setup', authenticateJWT, mfaController.generateMFASetup);
mfaRoutes.post('/verify', authenticateJWT, mfaController.verifyMFASetup);
mfaRoutes.put('/revoke', authenticateJWT, mfaController.revokeMFA);
mfaRoutes.post('/verify-login', mfaController.verifyMFAlogin);

export default mfaRoutes;
