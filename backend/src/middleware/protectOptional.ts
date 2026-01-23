import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protectOptional = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;
  if (!token) return next(); // guest

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    (req as any).userId = decoded.userId;
  } catch {
    // invalid token → treat as guest
  }

  next();
};

