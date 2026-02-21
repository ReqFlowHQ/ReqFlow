// FILE: backend/src/config/db.ts
import mongoose from "mongoose";

interface ConnectDbOptions {
  required?: boolean;
}

const connectDB = async (options: ConnectDbOptions = {}): Promise<boolean> => {
  const required = options.required ?? true;
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI || typeof mongoURI !== "string") {
    if (required) {
      throw new Error("❌ MONGO_URI is not defined or invalid in environment variables.");
    }
    console.warn("⚠️ MongoDB URI is not configured. Skipping MongoDB connection.");
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  await mongoose.connect(mongoURI, {
    dbName: "reqflow",
    // Keep index build off in production to reduce startup/lock pressure.
    autoIndex: process.env.NODE_ENV !== "production",
    connectTimeoutMS: 10000,
  });

  console.log("✅ MongoDB connected successfully!");
  return true;
};

export default connectDB;
