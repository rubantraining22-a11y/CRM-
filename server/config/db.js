import mongoose from 'mongoose';
import dns from 'node:dns';

// Ensure SRV records resolve reliably on Windows / Node.js
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom DNS servers cannot be set
}

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp_crm';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`[Database] MongoDB connection failed (${err.message}). Running in resilient In-Memory seed mode.`);
    return false;
  }
};
