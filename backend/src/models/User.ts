// FILE: backend/src/models/User.ts
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider?: "local" | "google" | "github";
  providerId?: string;
  isVerified: boolean;
  comparePassword: (candidate: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    provider: { type: String, default: "local" },
    providerId: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password!);
};

export default mongoose.model<IUser>("User", UserSchema);
