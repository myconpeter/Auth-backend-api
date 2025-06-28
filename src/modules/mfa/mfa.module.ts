import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.services';

const mfaService = new MfaService();
const mfaController = new MfaController(mfaService);

export { mfaController, mfaService };
