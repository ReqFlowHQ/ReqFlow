// FILE: backend/src/routes/guestRoutes.ts
import { Router } from "express";
import crypto from "crypto";
import GuestUsage from "../models/GuestUsage";

const router = Router();
const MAX_GUEST_GETS = 5;

router.get("/status", async (req, res) => {
  try {
    if ((req as any).userId) {
      return res.json({ isGuest: false });
    }

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

    const usage = await GuestUsage.findOne({ key, date: today });

    const remaining = usage
      ? Math.max(0, MAX_GUEST_GETS - usage.count)
      : MAX_GUEST_GETS;

    // ✅ UTC midnight reset (safe)
    const now = new Date();
    const resetAt = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0
    ));

    return res.json({
      isGuest: true,
      limit: MAX_GUEST_GETS,
      remaining,
      resetAt: resetAt.toISOString(),
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch guest status" });
  }
});

export default router;


