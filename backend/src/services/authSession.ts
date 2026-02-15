import crypto from "crypto";
import jwt from "jsonwebtoken";
import RefreshSession, { hashRefreshToken } from "../models/RefreshSession";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

const getIp = (headers: Record<string, unknown>, fallback?: string): string => {
  const direct = headers["cf-connecting-ip"] as string | undefined;
  if (direct) return direct;
  const forwarded = headers["x-forwarded-for"] as string | undefined;
  if (forwarded) return forwarded.split(",")[0].trim();
  return fallback || "unknown";
};

const getRefreshSecret = (): string => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "";

export const signAccessToken = (userId: string): string =>
  jwt.sign({ userId, type: "access" }, process.env.JWT_SECRET as string, {
    expiresIn: ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });

const parseAccessTokenMs = (): number => {
  const match = ACCESS_TOKEN_TTL.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const [, amountRaw, unit] = match;
  const amount = Number(amountRaw);
  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
};

export const accessTokenMaxAgeMs = parseAccessTokenMs();
export const refreshTokenMaxAgeMs = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export const createRefreshSession = async (
  userId: string,
  meta: { userAgent?: string; ip?: string }
) => {
  const jti = crypto.randomUUID();
  const secret = getRefreshSecret();
  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  const token = jwt.sign({ userId, jti, type: "refresh" }, secret, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` as jwt.SignOptions["expiresIn"],
  });

  await RefreshSession.create({
    user: userId,
    jti,
    tokenHash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
    userAgent: meta.userAgent,
    ip: meta.ip,
    lastUsedAt: new Date(),
  });

  return token;
};

export const revokeRefreshToken = async (token: string) => {
  const secret = getRefreshSecret();
  if (!secret) return;

  let decoded: { jti: string } | null = null;
  try {
    decoded = jwt.verify(token, secret) as { jti: string };
  } catch {
    decoded = null;
  }
  if (!decoded?.jti) return;

  await RefreshSession.updateOne(
    { jti: decoded.jti, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

export const rotateRefreshToken = async (
  token: string,
  reqMeta: { headers: Record<string, unknown>; remoteAddress?: string }
) => {
  const secret = getRefreshSecret();
  if (!secret) {
    return { ok: false as const, reason: "Refresh secret is missing" };
  }

  let payload: { userId: string; jti: string; type: "refresh" };
  try {
    payload = jwt.verify(token, secret) as { userId: string; jti: string; type: "refresh" };
  } catch {
    return { ok: false as const, reason: "Invalid refresh token" };
  }

  if (payload.type !== "refresh" || !payload.jti) {
    return { ok: false as const, reason: "Invalid refresh token type" };
  }

  const current = await RefreshSession.findOne({ jti: payload.jti });
  if (!current) {
    return { ok: false as const, reason: "Refresh session not found" };
  }
  if (current.revokedAt) {
    return { ok: false as const, reason: "Refresh session revoked" };
  }
  if (current.expiresAt.getTime() <= Date.now()) {
    return { ok: false as const, reason: "Refresh session expired" };
  }
  if (current.tokenHash !== hashRefreshToken(token)) {
    await RefreshSession.updateOne({ _id: current._id }, { $set: { revokedAt: new Date() } });
    return { ok: false as const, reason: "Refresh token mismatch" };
  }

  const nextToken = await createRefreshSession(payload.userId, {
    userAgent: (reqMeta.headers["user-agent"] as string | undefined) || "unknown",
    ip: getIp(reqMeta.headers, reqMeta.remoteAddress),
  });
  const nextPayload = jwt.decode(nextToken) as { jti: string };

  await RefreshSession.updateOne(
    { _id: current._id, revokedAt: null },
    {
      $set: {
        revokedAt: new Date(),
        replacedByJti: nextPayload.jti,
        lastUsedAt: new Date(),
      },
    }
  );

  const accessToken = signAccessToken(payload.userId);
  return {
    ok: true as const,
    userId: payload.userId,
    accessToken,
    refreshToken: nextToken,
  };
};
