// FILE: backend/src/models/RefreshToken.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
