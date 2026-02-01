// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

