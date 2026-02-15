import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protectOptional = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.split(" ")[1];

  if (!token) return next(); // guest

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      type?: string;
    };
    if (decoded.type && decoded.type !== "access") {
      return next();
    }
    (req as any).userId = decoded.userId;
  } catch {
    // invalid token → treat as guest
  }

  next();
};
