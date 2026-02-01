// FILE: backend/src/middleware/guest.ts
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import GuestUsage from "../models/GuestUsage";

const MAX_GUEST_GETS = 5;

export const guestGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Logged-in users bypass
    if ((req as any).userId) {
      return next();
    }

    const actualMethod =
      req.body?.method ||
      req.body?.request?.method;


    if (!actualMethod) {
      return res.status(400).json({
        message: "Invalid request payload",
      });
    }

    if (actualMethod !== "GET") {
      return res.status(403).json({
        message: "Guest users can only execute GET requests",
      });
    }

    // ---- rate limit logic ----
    // (your existing logic stays)


    /* ---------- RATE LIMIT ---------- */

    const ip =
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    const ua = req.headers["user-agent"] || "unknown";

    const key = crypto
      .createHash("sha256")
      .update(`${ip}-${ua}`)
      .digest("hex");

    const today = new Date().toISOString().slice(0, 10);

    let usage = await GuestUsage.findOne({ key });

    if (!usage || usage.date !== today) {
      usage = await GuestUsage.findOneAndUpdate(
        { key },
        { count: 1, date: today },
        { upsert: true, new: true }
      )!; // ✅ non-null assertion (safe here)

      (req as any).guestMeta = {
        limit: MAX_GUEST_GETS,
        remaining: MAX_GUEST_GETS - 1,
      };

      return next();
    }

    // 🔥 NOW TypeScript KNOWS usage exists
    if (usage.count >= MAX_GUEST_GETS) {
      (req as any).guestMeta = {
        limit: MAX_GUEST_GETS,
        remaining: 0,
      };

      return res.status(429).json({
        message: "Guest limit reached (5 GET requests per day)",
      });
    }

    usage.count += 1;
    await usage.save();

    (req as any).guestMeta = {
      limit: MAX_GUEST_GETS,
      remaining: MAX_GUEST_GETS - usage.count,
    };

    next();

  } catch (err) {
    console.error("Guest guard error:", err);
    res.status(500).json({ message: "Guest validation failed" });
  }
};

