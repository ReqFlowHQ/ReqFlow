import express from "express";
import axios, { AxiosRequestConfig } from "axios";
import { protect } from "../middleware/auth";
import { updateRequest } from '../controllers/requestController';
import {
  createRequest,
  executeAndSave,
  executeTemp,
  getRequestsByCollection,
  deleteRequest,
} from "../controllers/requestController";

const router = express.Router();

// ✅ Protect all request routes
router.use(protect);

// Core routes
router.post("/", createRequest);
router.get("/collection/:collectionId", getRequestsByCollection);
router.post("/:id/execute", executeAndSave);
router.delete("/:id", deleteRequest);
router.post("/execute-temp", executeTemp);

/**
 * 🧩 Proxy Route — Executes temporary requests safely
 *  - Prevents CORS errors
 *  - Supports all methods
 *  - Returns raw HTML / JSON / text properly
 */
router.put("/:id", updateRequest);
router.post("/proxy", async (req, res) => {
  const { url, method = "GET", headers = {}, body = {} } = req.body;

  if (!url || !/^https?:\/\//i.test(url.trim())) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const axiosConfig: AxiosRequestConfig = {
      method: method.toLowerCase() as any,
      url,
      headers,
      data: body,
      validateStatus: () => true, // ✅ prevent throwing on non-2xx
      timeout: 15000,
    };

    const response = await axios(axiosConfig);

    // Detect HTML vs JSON automatically
    const contentType = response.headers["content-type"] || "";
    let responseData = response.data;

    if (typeof responseData === "string" && contentType.includes("text/html")) {
      // Wrap HTML to prevent frontend “Invalid JSON”
      responseData = { html: responseData };
    }

    return res.status(200).json({
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (err: any) {
    console.error("❌ Proxy request failed:", err.message);
    return res.status(500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
});

export default router;
