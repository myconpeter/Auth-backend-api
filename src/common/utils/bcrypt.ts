import bcrypt from 'bcrypt';

const hashValue = async (value: string, saltRounds: number = 10) =>
	await bcrypt.hash(value, saltRounds);

const compareValue = async (value: string, hashValue: string) =>
	await bcrypt.compare(value, hashValue);

export{hashValue, compareValue}
