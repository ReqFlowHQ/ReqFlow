// FILE: backend/src/routes/authRoutes.ts
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { protect } from "../middleware/auth";
const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const isProd = process.env.NODE_ENV === "production";

// --- Google OAuth ---
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login`, session: false }),
  async (req, res) => {
    const user = req.user as any;

    // ✅ Create JWT token
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    // ✅ Redirect to frontend with token
    res
      .cookie("token", accessToken, {
        httpOnly: true,
        secure: isProd,                 // ❗ false on localhost
        sameSite: isProd ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
      })
      .redirect(`${FRONTEND_URL}/dashboard`);


  }
);

// --- GitHub OAuth ---
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: `${FRONTEND_URL}/login`, session: false }),
  async (req, res) => {
    const user = req.user as any;
    // ✅ Create JWT token
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    // ✅ Redirect to frontend with token
    res
      .cookie("token", accessToken, {
        httpOnly: true,
        secure: isProd,                 // ❗ false on localhost
        sameSite: isProd ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
      })
      .redirect(`${FRONTEND_URL}/dashboard`);


  }
);

router.get("/me", protect, async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const user = await User.findById(
    (req as any).userId
  ).select("-password");

  res.json({ user });
});



router.post("/logout", (req, res) => {
  res.clearCookie("token").json({ success: true });
});


export default router;
