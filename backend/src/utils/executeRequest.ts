// FILE: backend/src/utils/executeRequest.ts
import axios, { Method } from "axios";
import { validateSafeHttpUrl } from "./urlSafety";

const BLOCKED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "proxy-authorization",
  "proxy-authenticate",
  "x-forwarded-for",
  "x-real-ip",
  "content-length",
]);

const sanitizeHeaders = (
  headers: Record<string, string | number | boolean | null | undefined>
): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (value === undefined || value === null) continue;
    const normalized = key.trim().toLowerCase();
    if (!normalized || BLOCKED_REQUEST_HEADERS.has(normalized)) continue;
    sanitized[normalized] = String(value);
  }
  return sanitized;
};

export const executeRequest = async (
  method: Method,
  url: string,
  headers: Record<string, string | number | boolean | null | undefined>,
  body?: any
) => {
  try {
    const urlCheck = await validateSafeHttpUrl(url);
    if (!urlCheck.ok) {
      return {
        status: 400,
        statusText: "Blocked URL",
        data: { error: `Blocked URL: ${urlCheck.reason}` },
        headers: {},
      };
    }

    const response = await axios({
      method,
      url,
      headers: sanitizeHeaders(headers),
      data: body,
      timeout: 15000,
      maxRedirects: 0,
      validateStatus: () => true,
    });
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    };
  } catch (err: any) {
    return {
      status: 0,
      statusText: "Request Error",
      data: err.message || "Network error",
      headers: {},
    };
  }
};
