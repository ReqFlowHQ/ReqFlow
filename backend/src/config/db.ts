// FILE: backend/src/config/db.ts
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI || typeof mongoURI !== "string") {
      throw new Error("❌ MONGO_URI is not defined or invalid in environment variables.");
    }

    await mongoose.connect(mongoURI, {
      dbName: "reqflow",
      // Optional clean connection options
      autoIndex: true,
      connectTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("🚨 MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;

