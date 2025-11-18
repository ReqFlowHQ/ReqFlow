// FILE: backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshToken";
import { generateAccessToken } from "../utils/generateToken";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  const refresh = req.cookies?.refreshToken || req.body.refreshToken;
  if (!refresh) return res.status(401).json({ message: "Missing refresh token" });

  const entry = await RefreshToken.findOne({ token: refresh });
  if (!entry || entry.expires < new Date())
    return res.status(403).json({ message: "Expired refresh token" });

  const newAccess = generateAccessToken(entry.user.toString());
  return res.json({ accessToken: newAccess });
};
