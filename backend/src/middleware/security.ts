import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://reqflow.onlineappsandservices.online",
];

const trustedOrigins = new Set(allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins);
const CSRF_COOKIE_NAME = "csrfToken";

const getOriginFromReferer = (referer?: string): string | null => {
  if (!referer) return null;
  try {
    const parsed = new URL(referer);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
};

const hasTrustedOrigin = (req: Request): boolean => {
  const origin = req.headers.origin;
  if (origin && trustedOrigins.has(origin)) return true;
  const refererOrigin = getOriginFromReferer(req.headers.referer);
  return Boolean(refererOrigin && trustedOrigins.has(refererOrigin));
};

const shouldProtect = (req: Request): boolean => {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;
  if (req.path.startsWith("/api/auth/google")) return false;
  if (req.path.startsWith("/api/auth/github")) return false;
  return true;
};

export const ensureCsrfCookie = (req: Request, res: Response, next: NextFunction) => {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  next();
};

export const csrfAndOriginProtection = (req: Request, res: Response, next: NextFunction) => {
  if (!shouldProtect(req)) return next();

  if (!hasTrustedOrigin(req)) {
    return res.status(403).json({ error: "Untrusted request origin" });
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers["x-csrf-token"];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  return next();
};

export const getTrustedOrigins = (): string[] => Array.from(trustedOrigins);
