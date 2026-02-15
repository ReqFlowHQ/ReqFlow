import crypto from "crypto";
import { Schema, model, Types, Document } from "mongoose";

export interface IRefreshSession extends Document {
  user: Types.ObjectId;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedByJti?: string | null;
  lastUsedAt?: Date | null;
  userAgent?: string;
  ip?: string;
}

const RefreshSessionSchema = new Schema<IRefreshSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    replacedByJti: { type: String, default: null },
    lastUsedAt: { type: Date, default: null },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export default model<IRefreshSession>("RefreshSession", RefreshSessionSchema);
