// backend/src/middleware/attachUser.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const attachUser = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.split(" ")[1];

    if (!token) return next();

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { userId: string; type?: string };

    if (decoded.type && decoded.type !== "access") {
      return next();
    }

    req.userId = decoded.userId; // ✅ FIX
  } catch {
    // invalid/expired token: anonymous request
  }

  next();
};
