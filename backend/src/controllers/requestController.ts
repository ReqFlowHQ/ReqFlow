import { Request, Response } from "express";
import { validateSafeHttpUrl } from "../utils/urlSafety";
import { executeRequest } from "../utils/executeRequest";
import { buildRequestUrlWithParams } from "../utils/requestUrl";
import { applyAuthToRequest } from "../utils/requestAuth";
import {
  interpolateTemplateString,
  interpolateTemplateValue,
  toInterpolationVariables,
} from "../utils/templateInterpolation";
import { resolveRepositoryRegistry } from "../data/repositories/requestContext";
import type { RunAssertionResultEntity, StoredResponse } from "../data/entities";
import { evaluateAssertion } from "../utils/assertions";
import { runInBackground } from "../utils/backgroundJob";
import {
  createZeroNetworkTiming,
  logInternalPerformance,
  nowMs,
  toCanonicalLatencyMs,
  type NetworkTimingBreakdown,
} from "../utils/performanceMetrics";

const toStoredHeaderValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(", ");
  }
  if (value === undefined || value === null) {
    return "";
  }
  if (Buffer.isBuffer(value)) {
    return value.toString("utf8");
  }
  return String(value);
};

const normalizeHeadersForStorage = (
  headers: Record<string, unknown>
): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers || {})) {
    normalized[key] = toStoredHeaderValue(value);
  }
  return normalized;
};

interface PersistExecutionArgs {
  userId: string;
  requestId: string;
  method: string;
  latencyMs: number;
  storedResponse: StoredResponse;
  startedAt: number;
  networkTiming: NetworkTimingBreakdown;
  route: string;
}

const persistSavedExecutionArtifacts = async (
  req: Request,
  params: PersistExecutionArgs
): Promise<void> => {
  const repositories = resolveRepositoryRegistry(req);
  let dbMs = 0;
  let assertionsMs = 0;

  try {
    let dbStartedAt = nowMs();
    await repositories.requests.saveResponse(
      params.requestId,
      params.userId,
      params.storedResponse
    );
    dbMs += nowMs() - dbStartedAt;

    const assertionsStartedAt = nowMs();
    const assertions = await repositories.assertions.listByRequest(
      params.userId,
      params.requestId
    );

    const assertionResults: RunAssertionResultEntity[] = assertions
      .filter((assertion) => assertion.enabled)
      .map((assertion) => evaluateAssertion(assertion, params.storedResponse));
    assertionsMs = nowMs() - assertionsStartedAt;

    dbStartedAt = nowMs();
    await repositories.runs.create({
      user: params.userId,
      request: params.requestId,
      status: params.storedResponse.status,
      statusText: params.storedResponse.statusText,
      durationMs: params.latencyMs,
      response: params.storedResponse,
      assertionResults,
    });
    dbMs += nowMs() - dbStartedAt;
  } catch (historyError) {
    console.error("⚠️ Failed to persist run history/assertions:", historyError);
  } finally {
    logInternalPerformance({
      route: params.route,
      request_id: params.requestId,
      method: params.method,
      status: params.storedResponse.status,
      outbound_proxy_ms: params.networkTiming.outbound_proxy_ms,
      response_receive_ms: params.networkTiming.response_receive_ms,
      network_ms: params.networkTiming.network_ms,
      db_ms: dbMs,
      assertions_ms: assertionsMs,
      total_internal_ms: nowMs() - params.startedAt,
    });
  }
};

/* ----------------------------- Create Request ----------------------------- */
export const createRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { name, method, url, params, auth, headers, body, collection } = req.body;
    if (!url || typeof url !== "string" || url.trim() === "") {
      return res.status(400).json({ error: "URL must be a non-empty string." });
    }

    const repositories = resolveRepositoryRegistry(req);
    const request = await repositories.requests.create({
      user: userId,
      name,
      method,
      url,
      params,
      auth,
      headers,
      body,
      collection,
    });

    return res.status(201).json(request);
  } catch (err: any) {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Unknown error";
    console.error("Error creating request:", err);
    return res.status(500).json({ error: msg });
  }
};

/* ----------------------------- Execute and Save ----------------------------- */
export const executeAndSave = async (req: Request, res: Response) => {
  const route = "POST /api/requests/:id/execute";
  const startedAt = nowMs();
  let networkTiming = createZeroNetworkTiming();

  try {
    const userId = req.userId as string;
    const requestId = req.params.id;
    const repositories = resolveRepositoryRegistry(req);
    const interpolationVariables = toInterpolationVariables(
      req.body?.environmentVariables
    );

    const dbRequest = await repositories.requests.findByIdForUser(requestId, userId);

    if (!dbRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    const resolvedUrl = interpolateTemplateString(
      dbRequest.url || "",
      interpolationVariables
    );
    const resolvedParams = interpolateTemplateValue(
      (dbRequest.params as any) || {},
      interpolationVariables
    );
    const resolvedHeaders = interpolateTemplateValue(
      (dbRequest.headers as any) || {},
      interpolationVariables
    );
    const resolvedAuth = interpolateTemplateValue(
      (dbRequest.auth as any) || { type: "none" },
      interpolationVariables
    );
    const resolvedBody = interpolateTemplateValue(
      dbRequest.body,
      interpolationVariables
    );

    const authApplied = applyAuthToRequest({
      auth: resolvedAuth as any,
      headers: resolvedHeaders as any,
      params: resolvedParams as any,
    });
    const effectiveUrl = buildRequestUrlWithParams(resolvedUrl, authApplied.params);

    const urlCheck = await validateSafeHttpUrl(effectiveUrl);
    if (!urlCheck.ok) {
      return res.status(400).json({ error: `Blocked URL: ${urlCheck.reason}` });
    }

    const methodUpper = String(dbRequest.method || "GET").toUpperCase();
    const response = await executeRequest(
      dbRequest.method as any,
      effectiveUrl,
      authApplied.headers,
      methodUpper !== "GET" ? resolvedBody : undefined,
      {
        skipSafetyCheck: true,
        onTiming: (timing) => {
          networkTiming = timing;
        },
      }
    );

    const contentType =
      ((response.headers as Record<string, unknown>)["content-type"] as string) || "";
    let responseData = response.data;

    if (typeof responseData === "string" && contentType.includes("text/html")) {
      responseData = { html: responseData };
    } else if (
      typeof responseData === "string" &&
      contentType.includes("text/plain")
    ) {
      responseData = { text: responseData };
    }

    const storedResponse: StoredResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: normalizeHeadersForStorage(
        response.headers as Record<string, unknown>
      ),
      data: responseData,
    };
    const latencyMs = toCanonicalLatencyMs(networkTiming);

    // Return the upstream payload immediately; persist artifacts asynchronously.
    res.status(200).json({
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      latencyMs,
    });

    runInBackground(async () => {
      await persistSavedExecutionArtifacts(req, {
        userId,
        requestId,
        method: methodUpper,
        latencyMs,
        storedResponse,
        startedAt,
        networkTiming,
        route,
      });
    });

    return;
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
  const userId = req.userId as string;
  const { collectionId } = req.params;
  const parsedLimit = Number(req.query.limit);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 500)
      : 200;

  const repositories = resolveRepositoryRegistry(req);
  const requests = await repositories.requests.listByCollection(
    userId,
    collectionId,
    limit
  );
  return res.json(requests);
};

/* ----------------------------- Get Request Execution History ----------------------------- */
export const getRequestExecutionHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const requestId = req.params.id;
    const repositories = resolveRepositoryRegistry(req);

    const request = await repositories.requests.findByIdForUser(requestId, userId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const parsedLimit = Number(req.query.limit);
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 20;

    const beforeRaw =
      typeof req.query.before === "string" ? req.query.before.trim() : "";
    const before =
      beforeRaw && !Number.isNaN(new Date(beforeRaw).valueOf())
        ? beforeRaw
        : undefined;

    const runs = await repositories.runs.listByRequest(userId, requestId, {
      limit: limit + 1,
      before,
    });

    const hasMore = runs.length > limit;
    const items = hasMore ? runs.slice(0, limit) : runs;
    const nextCursor = hasMore
      ? String(items[items.length - 1]?.createdAt || "")
      : null;

    return res.json({
      items,
      page: {
        limit,
        hasMore,
        nextCursor,
      },
    });
  } catch (err) {
    console.error("Error loading execution history:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* ----------------------------- Delete Request ----------------------------- */
export const deleteRequest = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { id } = req.params;

  const repositories = resolveRepositoryRegistry(req);
  await repositories.requests.deleteByIdForUser(id, userId);

  await Promise.allSettled([
    repositories.runs.deleteByRequest(userId, id),
    repositories.assertions.deleteByRequest(userId, id),
    repositories.monitors.deleteByRequest(userId, id),
  ]);

  return res.json({ message: "Request deleted" });
};

/* ----------------------------- Temporary Execution ----------------------------- */
export const executeTemp = async (req: Request, res: Response) => {
  const startedAt = nowMs();
  let networkTiming = createZeroNetworkTiming();

  try {
    const { url, method = "GET", params = {}, auth, headers = {}, body } = req.body;
    const interpolationVariables = toInterpolationVariables(
      req.body?.environmentVariables
    );
    const resolvedUrl = interpolateTemplateString(url || "", interpolationVariables);
    const resolvedParams = interpolateTemplateValue(params, interpolationVariables);
    const resolvedHeaders = interpolateTemplateValue(headers, interpolationVariables);
    const resolvedAuth = interpolateTemplateValue(auth, interpolationVariables);
    const resolvedBody = interpolateTemplateValue(body, interpolationVariables);

    const authApplied = applyAuthToRequest({
      auth: resolvedAuth as any,
      headers: resolvedHeaders as any,
      params: resolvedParams as any,
    });
    const effectiveUrl = buildRequestUrlWithParams(resolvedUrl, authApplied.params);

    if (!effectiveUrl || !/^https?:\/\//i.test(effectiveUrl)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const urlCheck = await validateSafeHttpUrl(effectiveUrl);
    if (!urlCheck.ok) {
      return res.status(400).json({ error: `Blocked URL: ${urlCheck.reason}` });
    }

    const upperMethod = method.toUpperCase();

    const response = await executeRequest(
      upperMethod as any,
      effectiveUrl,
      {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        ...authApplied.headers,
      },
      upperMethod !== "GET" ? resolvedBody : undefined,
      {
        skipSafetyCheck: true,
        onTiming: (timing) => {
          networkTiming = timing;
        },
      }
    );

    const contentType =
      ((response.headers as Record<string, unknown>)["content-type"] as string) || "";
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

    logInternalPerformance({
      route: "POST /api/requests/proxy",
      method: upperMethod,
      status: response.status,
      outbound_proxy_ms: networkTiming.outbound_proxy_ms,
      response_receive_ms: networkTiming.response_receive_ms,
      network_ms: networkTiming.network_ms,
      db_ms: 0,
      assertions_ms: 0,
      total_internal_ms: nowMs() - startedAt,
    });

    return res.status(response.status).json({
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      latencyMs: toCanonicalLatencyMs(networkTiming),
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
    const userId = req.userId as string;

    const repositories = resolveRepositoryRegistry(req);
    const updatedRequest = await repositories.requests.updateByIdForUser(
      id,
      userId,
      update
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" });
    }
    return res.json(updatedRequest);
  } catch (err) {
    console.error("Error updating request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
