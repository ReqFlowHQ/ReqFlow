// FILE: backend/src/routes/authRoutes.ts
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { protect } from "../middleware/auth";
import { attachUser } from "../middleware/attachUser";
const router = express.Router();
const isProd = process.env.NODE_ENV === "production";

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

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
        path: "/",
      })
      .redirect(`${frontendUrl}/dashboard`);
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

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
        path: "/",
      })
      .redirect(`${frontendUrl}/dashboard`);
  }
);


router.get("/me", attachUser, async (req, res) => {
  if (!req.userId) {
    return res.status(200).json({ user: null });
  }

  const user = await User.findById(req.userId).select("-password");
  return res.json({ user });
});




router.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return res.json({ success: true });
});

router.post("/force-logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return res.json({ success: true });
});




export default router;
