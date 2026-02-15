// FILE: backend/src/controllers/requestController.ts
import { Request, Response } from "express";
import RequestModel from "../models/Request";
import { validateSafeHttpUrl } from "../utils/urlSafety";
import { executeRequest } from "../utils/executeRequest";

/* ----------------------------- Create Request ----------------------------- */
export const createRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
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
    const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Unknown error";
    console.error("Error creating request:", err);
    return res.status(500).json({ error: msg });
  }
};

/* ----------------------------- Execute and Save ----------------------------- */
export const executeAndSave = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const requestId = req.params.id;
    const dbRequest = await RequestModel.findOne({ _id: requestId, user: userId });

    if (!dbRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    const urlCheck = await validateSafeHttpUrl(dbRequest.url);
    if (!urlCheck.ok) {
      return res.status(400).json({ error: `Blocked URL: ${urlCheck.reason}` });
    }

    console.log("💾 Executing SAVED request for ID:", requestId);

    const response = await executeRequest(
      dbRequest.method as any,
      dbRequest.url,
      dbRequest.headers || {},
      dbRequest.method.toUpperCase() !== "GET" ? dbRequest.body : undefined
    );

    const contentType = ((response.headers as Record<string, unknown>)["content-type"] as string) || "";
    let responseData = response.data;

    if (typeof responseData === "string" && contentType.includes("text/html")) {
      responseData = { html: responseData };
    } else if (typeof responseData === "string" && contentType.includes("text/plain")) {
      responseData = { text: responseData };
    }

    // Normalize headers before saving
    const plainHeaders: Record<string, string> = {};
    for (const key in response.headers) {
      const value = (response.headers as Record<string, unknown>)[key];
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
  const userId = req.userId;
  const { collectionId } = req.params;
  const parsedLimit = Number(req.query.limit);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 500)
      : 200;

  const requests = await RequestModel.find({ user: userId, collection: collectionId })
    .select("name method url headers body response collection createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
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
    const { url, method = "GET", headers = {}, body } = req.body;

    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const urlCheck = await validateSafeHttpUrl(url);
    if (!urlCheck.ok) {
      return res.status(400).json({ error: `Blocked URL: ${urlCheck.reason}` });
    }

    const upperMethod = method.toUpperCase();

    const response = await executeRequest(
      upperMethod as any,
      url,
      {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        ...headers,
      },
      upperMethod !== "GET" ? body : undefined
    );

    const contentType = ((response.headers as Record<string, unknown>)["content-type"] as string) || "";
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
