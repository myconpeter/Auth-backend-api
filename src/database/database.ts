import mongoose from 'mongoose';
import { config } from '../config/app.config';

const connectDB = async () => {
  let mongoUri: string = '';
  if (config.NODE_ENV === 'development') {
    mongoUri = config.MONGO_LOCAL_URI;
    console.log('using local database');
  } else if (config.NODE_ENV === 'production') {
    mongoUri = config.MONGO_LOCAL_URI;
    console.log('using production database');
  } else {
    console.error('env not set correctly');
  }
  try {
    await mongoose.connect(config.MONGO_LOCAL_URI);
    console.log('connected to database');
  } catch (error) {
    console.error(`Cannot connect to database`);
    process.exit(1);
  }
};

export default connectDB;
