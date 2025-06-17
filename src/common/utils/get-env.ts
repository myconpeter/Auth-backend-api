const getEnv = (key: string, defaultValue: string = ''): string => {
	const value = process.env[key];
	if (value === undefined) {
		if (defaultValue) {
			return defaultValue;
		}
		throw new Error(`Env value of ${key} not set`);
	}
	return value;
};

export default getEnv;
