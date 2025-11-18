// FILE: backend/src/routes/authRoutes.ts
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

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
    res.redirect(`${FRONTEND_URL}/oauth/success?token=${accessToken}`);
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
    res.redirect(`${FRONTEND_URL}/oauth/success?token=${accessToken}`);
  }
);

export default router;
