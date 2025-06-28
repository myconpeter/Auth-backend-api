import { SessionController } from './session.controller';
import { SessionService } from './session.service';

const sessionService = new SessionService();
const sessionController = new SessionController(sessionService);

export { sessionController, sessionService };
