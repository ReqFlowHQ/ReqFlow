// FILE: backend/src/controllers/authController.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import RefreshToken from "../models/RefreshToken";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import sendEmail from "../utils/sendEmail";
import { verificationEmailTemplate } from "../utils/emailTemplates";

const createVerifyToken = (email: string) =>
  jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: "1d" });

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = await User.create({ name, email, password, provider: "local" });

    const verifyToken = createVerifyToken(email);
    const verifyLink = `${process.env.FRONTEND_URL}/verify/${verifyToken}`;
    const html = verificationEmailTemplate(name, verifyLink);

    await sendEmail(email, "Verify your ReqFlow account", html);
    res.json({ message: "Verification email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isVerified = true;
    await user.save();
    res.json({ message: "Email verified successfully" });
  } catch {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.provider !== "local")
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email first" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = await generateRefreshToken(user._id.toString());

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        accessToken,
        user: { id: user._id, name: user.name, email: user.email },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refresh = req.cookies?.refreshToken;
  if (refresh) await RefreshToken.deleteOne({ token: refresh });
  res.clearCookie("refreshToken").json({ message: "Logged out" });
};
