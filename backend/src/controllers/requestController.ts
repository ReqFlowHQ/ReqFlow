// FILE: backend/src/controllers/requestController.ts
import { Request, Response } from "express";
import RequestModel from "../models/Request";
import axios, { AxiosRequestConfig } from "axios";
import GuestUsage from "../models/GuestUsage";
import crypto from "crypto";

/* ----------------------------- Normalize Headers ----------------------------- */
const normalizeHeaders = (
  headers: unknown
): Record<string, string | number | boolean | null | undefined> => {
  const normalized: Record<string, string | number | boolean | null | undefined> = {};
  if (headers && typeof headers === "object") {
    for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        normalized[key] = value;
      } else if (Array.isArray(value)) {
        normalized[key] = (value as any[]).map(String).join(", ");
      }
    }
  }
  return normalized;
};

/* ----------------------------- Create Request ----------------------------- */
export const createRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, method, url, headers, body, collection } = req.body;
    if (!url || typeof url !== 'string' || url.trim() === "") {
      return res.status(400).json({ error: "URL must be a non-empty string." });

    }
    const request = await RequestModel.create({
      user: userId,
      name,
      method,
      url,
      headers,
      body,
      collection,
    });

    res.status(201).json(request);
  }
  catch (err: any) {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Unknown error"
    console.error("Error creating request:", err);
    res.status(500).json({ error: "URL must be a non-empty string" });
    throw new Error(msg);
  }
};

/* ----------------------------- Execute and Save ----------------------------- */
export const executeAndSave = async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const dbRequest = await RequestModel.findById(requestId);
    if (!dbRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    console.log("💾 Executing SAVED request for ID:", requestId);

    const method = dbRequest.method.toUpperCase();

    const axiosConfig: AxiosRequestConfig = {
      method: method.toLowerCase() as any,
      url: dbRequest.url,
      headers: dbRequest.headers || {},
      validateStatus: () => true,
      timeout: 15000,
    };

    // ✅ ONLY attach body for non-GET methods
    if (method !== "GET" && dbRequest.body) {
      axiosConfig.data = dbRequest.body;
    }

    const response = await axios(axiosConfig);

    const contentType = response.headers["content-type"] || "";
    let responseData = response.data;

    if (typeof responseData === "string" && contentType.includes("text/html")) {
      responseData = { html: responseData };
    } else if (typeof responseData === "string" && contentType.includes("text/plain")) {
      responseData = { text: responseData };
    }

    // Normalize headers before saving
    const plainHeaders: Record<string, string> = {};
    for (const key in response.headers) {
      const value = (response.headers as any)[key];
      plainHeaders[key] =
        typeof value === "string" ? value : JSON.stringify(value);
    }

    dbRequest.response = {
      status: response.status,
      statusText: response.statusText,
      headers: plainHeaders,
      data: responseData,
    };

    await dbRequest.save();

    return res.status(200).json({
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (err: any) {
    console.error("❌ Execute saved request failed:", err.message);
    return res.status(500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
};


/* ----------------------------- Get Requests by Collection ----------------------------- */
export const getRequestsByCollection = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { collectionId } = req.params;

  const requests = await RequestModel.find({ user: userId, collection: collectionId });
  res.json(requests);
};

/* ----------------------------- Delete Request ----------------------------- */
export const deleteRequest = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  await RequestModel.deleteOne({ _id: id, user: userId });
  res.json({ message: "Request deleted" });
};

/* ----------------------------- Temporary Execution ----------------------------- */
export const executeTemp = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    console.log("EXEC TEMP userId =", (req as any).userId);

    /* ───────────── Validate request ───────────── */
    const { url, method = "GET", headers = {}, body } = req.body;

    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const upperMethod = method.toUpperCase();

    /* ───────────── Execute request ───────────── */
    const response = await axios({
      method: upperMethod.toLowerCase() as any,
      url,
      headers: {
        // 🔥 REQUIRED for Google / Bing / Cloudflare
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        ...headers, // user headers override defaults
      },
      validateStatus: () => true,
      timeout: 15000,
      ...(upperMethod !== "GET" && body ? { data: body } : {}),
    });

    /* ───────────── Normalize response ───────────── */
    const contentType = response.headers["content-type"] || "";
    let responseData = response.data;

    if (typeof responseData === "string" && contentType.includes("text/html")) {
      responseData = { html: responseData };
    } else if (typeof responseData === "string") {
      responseData = { text: responseData };
    }
    if ((req as any).guestMeta) {
      res.setHeader("x-guest-limit", (req as any).guestMeta.limit);
      res.setHeader("x-guest-remaining", (req as any).guestMeta.remaining);
    }

    return res.status(response.status).json({
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (err: any) {
    console.error("❌ Execute temp request failed:", err.message);
    return res.status(500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
};




export const updateRequest = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const update = req.body;

    // Optionally add user authorization if needed
    const userId = (req as any).userId;

    const updatedRequest = await RequestModel.findOneAndUpdate(
      { _id: id, user: userId },
      update,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json(updatedRequest);
  } catch (err) {
    console.error("Error updating request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

