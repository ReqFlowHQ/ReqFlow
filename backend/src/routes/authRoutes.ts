// FILE: backend/src/routes/authRoutes.ts
import express from "express";
import passport from "passport";
import User from "../models/User";
import { attachUser } from "../middleware/attachUser";
import {
  accessTokenMaxAgeMs,
  createRefreshSession,
  refreshTokenMaxAgeMs,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from "../services/authSession";
const router = express.Router();
const isProd = process.env.NODE_ENV === "production";

const setAuthCookies = (res: express.Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: accessTokenMaxAgeMs,
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: refreshTokenMaxAgeMs,
    path: "/api/auth",
  });
};

const clearAuthCookies = (res: express.Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
  });
};

// --- Google OAuth ---
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    const frontendUrl =
      process.env.FRONTEND_URL ?? "http://localhost:3000";

    const user = req.user as any;
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = await createRefreshSession(user._id.toString(), {
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.socket.remoteAddress || "unknown",
    });

    setAuthCookies(res, accessToken, refreshToken);
    res.redirect(`${frontendUrl}/dashboard`);
  }
);


// --- GitHub OAuth ---
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);


// --- GitHub OAuth ---
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    const frontendUrl =
      process.env.FRONTEND_URL ?? "http://localhost:3000";

    const user = req.user as any;
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = await createRefreshSession(user._id.toString(), {
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.socket.remoteAddress || "unknown",
    });

    setAuthCookies(res, accessToken, refreshToken);
    res.redirect(`${frontendUrl}/dashboard`);
  }
);


router.get("/me", attachUser, async (req, res) => {
  if (!req.userId) {
    return res.status(200).json({ user: null });
  }

  const user = await User.findById(req.userId).select("-password");
  return res.json({ user });
});

router.get("/csrf", (req, res) => {
  const csrfToken = req.cookies?.csrfToken;
  return res.status(200).json({ csrfToken });
});

router.get("/verify-email", (_req, res) => {
  return res.status(410).json({
    error: "Email verification flow is deprecated",
    message: "ReqFlow uses OAuth sign-in. Please continue with Google or GitHub.",
  });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    clearAuthCookies(res);
    return res.status(401).json({ error: "Missing refresh token" });
  }

  const rotated = await rotateRefreshToken(token, {
    headers: req.headers as Record<string, unknown>,
    remoteAddress: req.socket.remoteAddress,
  });
  if (!rotated.ok) {
    clearAuthCookies(res);
    return res.status(401).json({ error: rotated.reason });
  }

  setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
  return res.json({ ok: true });
});


router.post("/logout", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    revokeRefreshToken(refreshToken).catch(() => undefined);
  }
  clearAuthCookies(res);
  return res.json({ success: true, revoked: Boolean(refreshToken) });
});

router.post("/force-logout", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    revokeRefreshToken(refreshToken).catch(() => undefined);
  }
  clearAuthCookies(res);
  return res.json({ success: true, revoked: Boolean(refreshToken) });
});




export default router;
