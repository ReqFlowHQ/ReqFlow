import axios, { Method } from "axios";
import http from "http";
import https from "https";
import { Readable } from "stream";
import { validateSafeHttpUrl } from "./urlSafety";
import type { NetworkTimingBreakdown } from "./performanceMetrics";
import { createZeroNetworkTiming, nowMs } from "./performanceMetrics";

const BLOCKED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "proxy-authorization",
  "proxy-authenticate",
  "x-forwarded-for",
  "x-real-ip",
  "content-length",
]);

const MAX_UPSTREAM_ERROR_PAYLOAD_BYTES = Number(
  process.env.UPSTREAM_ERROR_PAYLOAD_LIMIT_BYTES || 64 * 1024
);
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 15000);
const UPSTREAM_MAX_BODY_BYTES = Number(
  process.env.UPSTREAM_MAX_BODY_BYTES || 5 * 1024 * 1024
);
const UPSTREAM_MAX_SOCKETS = Number(process.env.UPSTREAM_MAX_SOCKETS || 200);
const UPSTREAM_MAX_FREE_SOCKETS = Number(
  process.env.UPSTREAM_MAX_FREE_SOCKETS || 20
);
const UPSTREAM_MAX_INFLIGHT = Number(process.env.UPSTREAM_MAX_INFLIGHT || 0);

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: UPSTREAM_MAX_SOCKETS,
  maxFreeSockets: UPSTREAM_MAX_FREE_SOCKETS,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: UPSTREAM_MAX_SOCKETS,
  maxFreeSockets: UPSTREAM_MAX_FREE_SOCKETS,
});

const upstreamClient = axios.create({
  timeout: UPSTREAM_TIMEOUT_MS,
  maxRedirects: 0,
  maxContentLength: UPSTREAM_MAX_BODY_BYTES,
  maxBodyLength: UPSTREAM_MAX_BODY_BYTES,
  validateStatus: () => true,
  httpAgent,
  httpsAgent,
});

let inflightCount = 0;
const waitQueue: Array<() => void> = [];

const runWithConcurrencyLimit = async <T>(task: () => Promise<T>): Promise<T> => {
  if (UPSTREAM_MAX_INFLIGHT <= 0) {
    return task();
  }

  if (inflightCount >= UPSTREAM_MAX_INFLIGHT) {
    await new Promise<void>((resolve) => {
      waitQueue.push(resolve);
    });
  }

  inflightCount += 1;
  try {
    return await task();
  } finally {
    inflightCount = Math.max(0, inflightCount - 1);
    const next = waitQueue.shift();
    if (next) next();
  }
};

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

const estimateSizeBytes = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string") {
    return Buffer.byteLength(value, "utf8");
  }
  if (Buffer.isBuffer(value)) {
    return value.byteLength;
  }
  if (ArrayBuffer.isView(value)) {
    return value.byteLength;
  }
  if (value instanceof ArrayBuffer) {
    return value.byteLength;
  }

  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

const sanitizeUpstreamErrorData = (value: unknown): unknown => {
  if (estimateSizeBytes(value) <= MAX_UPSTREAM_ERROR_PAYLOAD_BYTES) {
    return value;
  }
  return { omitted: true, reason: "Upstream error payload too large" };
};

const isInvalidProtocolError = (err: any): boolean => {
  const message = String(err?.message || "").toLowerCase();
  return (
    err?.code === "ERR_INVALID_URL" ||
    message.includes("unsupported protocol") ||
    message.includes("only http(s) protocols are supported")
  );
};

const isReadableStream = (value: unknown): value is Readable =>
  Boolean(
    value &&
      typeof (value as Readable).on === "function" &&
      typeof (value as Readable).pipe === "function"
  );

const normalizeResponseHeaders = (headers: unknown): Record<string, unknown> => {
  if (!headers || typeof headers !== "object") {
    return {};
  }

  const maybeAxiosHeaders = headers as { toJSON?: () => Record<string, unknown> };
  if (typeof maybeAxiosHeaders.toJSON === "function") {
    return maybeAxiosHeaders.toJSON();
  }

  return headers as Record<string, unknown>;
};

const readStreamWithLimit = async (
  stream: Readable,
  maxBytes: number
): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;

    stream.on("data", (chunk: Buffer | string) => {
      const normalizedChunk = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);
      received += normalizedChunk.byteLength;

      if (received > maxBytes) {
        stream.destroy();
        reject(new Error(`UPSTREAM_RESPONSE_TOO_LARGE:${received}`));
        return;
      }

      chunks.push(normalizedChunk);
    });

    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on("error", reject);
  });
};

const isJsonContentType = (contentType: string): boolean => {
  const normalized = contentType.toLowerCase();
  return (
    normalized.includes("application/json") ||
    normalized.includes("+json")
  );
};

const isTextContentType = (contentType: string): boolean => {
  const normalized = contentType.toLowerCase();
  return (
    normalized.startsWith("text/") ||
    normalized.includes("xml") ||
    normalized.includes("javascript") ||
    normalized.includes("x-www-form-urlencoded")
  );
};

const parseResponseBody = (buffer: Buffer, contentType: string): unknown => {
  if (buffer.byteLength === 0) {
    return "";
  }

  if (isJsonContentType(contentType)) {
    const rawText = buffer.toString("utf8");
    try {
      return JSON.parse(rawText);
    } catch {
      return rawText;
    }
  }

  if (isTextContentType(contentType) || !contentType) {
    return buffer.toString("utf8");
  }

  return buffer;
};

const timingFromSpan = (
  startedAt: number,
  endedAt: number
): NetworkTimingBreakdown => ({
  outbound_proxy_ms: Math.max(0, endedAt - startedAt),
  response_receive_ms: 0,
  network_ms: Math.max(0, endedAt - startedAt),
});

const emitTiming = (
  options: ExecuteRequestOptions | undefined,
  timing: NetworkTimingBreakdown
): void => {
  if (options?.onTiming) {
    options.onTiming(timing);
  }
};

export const normalizeNetworkError = (err: any) => {
  const code = String(err?.code || "");
  const message = String(err?.message || "");

  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return {
      status: 502,
      statusText: "Bad Gateway",
      data: {
        error: "Upstream network error",
        code: "DNS_RESOLUTION_FAILED",
        message: "Unable to resolve upstream domain name.",
      },
    };
  }

  if (code === "ECONNREFUSED") {
    return {
      status: 502,
      statusText: "Bad Gateway",
      data: {
        error: "Upstream network error",
        code: "CONNECTION_REFUSED",
        message: "Upstream host refused the connection.",
      },
    };
  }

  if (code === "ECONNABORTED") {
    return {
      status: 504,
      statusText: "Gateway Timeout",
      data: {
        error: "Upstream network error",
        code: "UPSTREAM_TIMEOUT",
        message: "Upstream request timed out.",
      },
    };
  }

  if (code === "ENETUNREACH" || code === "EHOSTUNREACH") {
    return {
      status: 502,
      statusText: "Bad Gateway",
      data: {
        error: "Upstream network error",
        code: "NETWORK_UNREACHABLE",
        message: "Network to upstream host is unreachable.",
      },
    };
  }

  if (isInvalidProtocolError(err)) {
    return {
      status: 400,
      statusText: "Bad Request",
      data: {
        error: "Upstream network error",
        code: "INVALID_PROTOCOL",
        message: "Invalid upstream protocol. Use HTTP or HTTPS.",
      },
    };
  }

  return {
    status: 502,
    statusText: "Bad Gateway",
    data: {
      error: "Upstream network error",
      code: "NETWORK_ERROR",
      message: message || "Failed to reach upstream host.",
    },
  };
};

export const normalizeUpstreamHttpError = (response: {
  status: number;
  statusText?: string;
  data?: unknown;
  headers?: Record<string, unknown>;
}) => ({
  status: response.status,
  statusText: response.statusText || "Upstream Error",
  data: {
    error: "Upstream responded with error",
    status: response.status,
    statusText: response.statusText || "Upstream Error",
    data: sanitizeUpstreamErrorData(response.data),
  },
  headers: response.headers || {},
});

export interface ExecuteRequestOptions {
  skipSafetyCheck?: boolean;
  onTiming?: (timing: NetworkTimingBreakdown) => void;
}

export const executeRequest = async (
  method: Method,
  url: string,
  headers: Record<string, string | number | boolean | null | undefined>,
  body?: any,
  options?: ExecuteRequestOptions
) => {
  const startedAt = nowMs();
  let capturedTiming = createZeroNetworkTiming();

  try {
    if (!options?.skipSafetyCheck) {
      const urlCheck = await validateSafeHttpUrl(url);
      if (!urlCheck.ok) {
        capturedTiming = timingFromSpan(startedAt, nowMs());
        emitTiming(options, capturedTiming);
        return {
          status: 400,
          statusText: "Bad Request",
          data: {
            error: "SSRF blocked error",
            code: "SSRF_BLOCKED",
            message: `Blocked URL: ${urlCheck.reason}`,
          },
          headers: {},
        };
      }
    }

    const response = await runWithConcurrencyLimit(() =>
      upstreamClient({
        method,
        url,
        headers: sanitizeHeaders(headers),
        data: body,
        responseType: "stream",
        transformResponse: [(data) => data],
      })
    );

    const headersReceivedAt = nowMs();
    const normalizedHeaders = normalizeResponseHeaders(response.headers);
    const contentType = String(normalizedHeaders["content-type"] || "");

    let responseData: unknown = "";
    if (isReadableStream(response.data)) {
      const responseBuffer = await readStreamWithLimit(
        response.data,
        UPSTREAM_MAX_BODY_BYTES
      );
      responseData = parseResponseBody(responseBuffer, contentType);
    } else {
      responseData = response.data;
    }

    const bodyReceivedAt = nowMs();
    capturedTiming = {
      outbound_proxy_ms: Math.max(0, headersReceivedAt - startedAt),
      response_receive_ms: Math.max(0, bodyReceivedAt - headersReceivedAt),
      network_ms: Math.max(0, bodyReceivedAt - startedAt),
    };
    emitTiming(options, capturedTiming);

    if (response.status >= 400) {
      return normalizeUpstreamHttpError({
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: normalizedHeaders,
      });
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: normalizedHeaders,
    };
  } catch (err: any) {
    const failedAt = nowMs();
    if (!capturedTiming.network_ms) {
      capturedTiming = timingFromSpan(startedAt, failedAt);
      emitTiming(options, capturedTiming);
    }

    if (err?.response) {
      const status = Number(err.response.status) || 502;
      const statusText = String(err.response.statusText || "Upstream Error");
      let responseData = err.response.data;
      const normalizedHeaders = normalizeResponseHeaders(err.response.headers || {});
      const contentType = String(normalizedHeaders["content-type"] || "");

      if (isReadableStream(responseData)) {
        try {
          const responseBuffer = await readStreamWithLimit(
            responseData,
            UPSTREAM_MAX_BODY_BYTES
          );
          responseData = parseResponseBody(responseBuffer, contentType);
        } catch (streamErr) {
          responseData = {
            error: "Upstream error response read failed",
            details: String((streamErr as Error).message || "unknown"),
          };
        }
      }

      return normalizeUpstreamHttpError({
        status,
        statusText,
        data: responseData,
        headers: normalizedHeaders,
      });
    }

    const normalized = normalizeNetworkError(err);
    return {
      status: normalized.status,
      statusText: normalized.statusText,
      data: normalized.data,
      headers: {},
    };
  }
};
