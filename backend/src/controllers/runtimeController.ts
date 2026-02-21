import { Request, Response } from "express";
import { executeRequest } from "../utils/executeRequest";
import { buildRequestUrlWithParams } from "../utils/requestUrl";
import { applyAuthToRequest } from "../utils/requestAuth";
import {
  interpolateTemplateString,
  interpolateTemplateValue,
  toInterpolationVariables,
} from "../utils/templateInterpolation";
import {
  createZeroNetworkTiming,
  logInternalPerformance,
  nowMs,
} from "../utils/performanceMetrics";

export const executeRuntime = async (req: Request, res: Response) => {
  const { request } = req.body;

  if (!request?.url || !request?.method) {
    return res.status(400).json({ error: "Invalid request payload" });
  }
  const interpolationVariables = toInterpolationVariables(
    req.body?.environmentVariables
  );
  const resolvedUrl = interpolateTemplateString(
    request.url || "",
    interpolationVariables
  );
  const resolvedParams = interpolateTemplateValue(
    request.params || {},
    interpolationVariables
  );
  const resolvedHeaders = interpolateTemplateValue(
    request.headers || {},
    interpolationVariables
  );
  const resolvedAuth = interpolateTemplateValue(
    request.auth || { type: "none" },
    interpolationVariables
  );
  const resolvedBody = interpolateTemplateValue(
    request.body || null,
    interpolationVariables
  );

  const authApplied = applyAuthToRequest({
    auth: resolvedAuth as any,
    headers: resolvedHeaders as any,
    params: resolvedParams as any,
  });
  const effectiveUrl = buildRequestUrlWithParams(resolvedUrl, authApplied.params);

  const startedAt = nowMs();
  let networkTiming = createZeroNetworkTiming();

  const result = await executeRequest(
    request.method,
    effectiveUrl,
    authApplied.headers,
    resolvedBody,
    {
      onTiming: (timing) => {
        networkTiming = timing;
      },
    }
  );

  const elapsed = Math.max(0, Math.round(nowMs() - startedAt));

  logInternalPerformance({
    route: "POST /api/runtime/execute",
    method: String(request.method || "GET").toUpperCase(),
    status: result.status,
    outbound_proxy_ms: networkTiming.outbound_proxy_ms,
    response_receive_ms: networkTiming.response_receive_ms,
    network_ms: networkTiming.network_ms,
    db_ms: 0,
    assertions_ms: 0,
    total_internal_ms: nowMs() - startedAt,
  });

  // ✅ SINGLE source of truth for headers
  const guestMeta = (req as any).guestMeta;
  if (guestMeta) {
    res.setHeader("x-guest-limit", String(guestMeta.limit));
    res.setHeader("x-guest-remaining", String(guestMeta.remaining));
  }

  return res.json({
    ...result,
    time: elapsed,
  });
};
