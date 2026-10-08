import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp_crm';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`[Database] MongoDB not reachable at ${uri}. Running in resilient In-Memory seed mode.`);
    return false;
  }
};
