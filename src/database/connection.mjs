import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/smartchain';

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('MongoDB disconnect error:', error);
  }
};
