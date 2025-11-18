// FILE: backend/src/utils/generateToken.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken";

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
};

export const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({ user: userId, token, expires });
  return token;
};

export const verifyRefreshToken = async (token: string) => {
  const found = await RefreshToken.findOne({ token });
  if (!found || found.expires < new Date()) return null;
  return found.user;
};
