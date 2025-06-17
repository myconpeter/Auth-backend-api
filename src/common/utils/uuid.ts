import { v4 as uuidV4 } from 'uuid';

export function generateUniqueCode() {
	return uuidV4().replace(/-/g, '').substring(0, 25);
}
