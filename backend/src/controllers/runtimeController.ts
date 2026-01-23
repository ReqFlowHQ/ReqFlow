import { Request, Response } from "express";
import { executeRequest } from "../utils/executeRequest";

export const executeRuntime = async (req: Request, res: Response) => {
  const { request } = req.body;

  if (!request?.url || !request?.method) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  const start = Date.now();

  const result = await executeRequest(
    request.method,
    request.url,
    request.headers || {},
    request.body || null
  );

  // ✅ SINGLE source of truth for headers
  const guestMeta = (req as any).guestMeta;
  if (guestMeta) {
    res.setHeader("x-guest-limit", String(guestMeta.limit));
    res.setHeader("x-guest-remaining", String(guestMeta.remaining));
  }

  return res.json({
    ...result,
    time: Date.now() - start,
  });
};


