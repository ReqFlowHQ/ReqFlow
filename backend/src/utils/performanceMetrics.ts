import { performance } from "perf_hooks";

export interface NetworkTimingBreakdown {
  outbound_proxy_ms: number;
  response_receive_ms: number;
  network_ms: number;
}

export interface InternalPerformanceLog {
  route: string;
  mode: "local" | "cloud";
  method: string;
  status: number;
  network_ms: number;
  db_ms: number;
  assertions_ms: number;
  total_internal_ms: number;
  outbound_proxy_ms?: number;
  response_receive_ms?: number;
  request_id?: string;
}

const PRECISION = 3;

const roundMs = (value: number): number =>
  Number((Number.isFinite(value) ? value : 0).toFixed(PRECISION));

export const nowMs = (): number => performance.now();

const resolvePerfMode = (): "local" | "cloud" => {
  const explicit = (process.env.REQFLOW_MODE || "").trim().toLowerCase();
  if (explicit === "cloud") return "cloud";
  if (explicit === "local") return "local";
  return process.env.NODE_ENV === "production" ? "cloud" : "local";
};

const perfLogsEnabled = (): boolean =>
  !["0", "false", "off"].includes(
    (process.env.PERF_LOG_ENABLED || "true").trim().toLowerCase()
  );

export const createZeroNetworkTiming = (): NetworkTimingBreakdown => ({
  outbound_proxy_ms: 0,
  response_receive_ms: 0,
  network_ms: 0,
});

export const toCanonicalLatencyMs = (
  timing: Partial<NetworkTimingBreakdown> | null | undefined
): number => {
  const networkMs = Number(timing?.network_ms);
  if (Number.isFinite(networkMs) && networkMs >= 0) {
    return Math.round(networkMs);
  }

  const outboundProxyMs = Number(timing?.outbound_proxy_ms);
  const responseReceiveMs = Number(timing?.response_receive_ms);
  const derivedNetworkMs = outboundProxyMs + responseReceiveMs;
  if (Number.isFinite(derivedNetworkMs) && derivedNetworkMs >= 0) {
    return Math.round(derivedNetworkMs);
  }

  return 0;
};

export const logInternalPerformance = (
  payload: Omit<InternalPerformanceLog, "mode"> & { mode?: "local" | "cloud" }
): void => {
  if (!perfLogsEnabled()) {
    return;
  }

  const structuredPayload = {
    event: "request_execution_performance",
    ts: new Date().toISOString(),
    route: payload.route,
    mode: payload.mode || resolvePerfMode(),
    method: payload.method,
    status: payload.status,
    outbound_proxy_ms: roundMs(payload.outbound_proxy_ms ?? 0),
    response_receive_ms: roundMs(payload.response_receive_ms ?? 0),
    network_ms: roundMs(payload.network_ms),
    db_ms: roundMs(payload.db_ms),
    assertions_ms: roundMs(payload.assertions_ms),
    total_internal_ms: roundMs(payload.total_internal_ms),
    request_id: payload.request_id,
  };

  // Required structured metrics payload.
  console.info(JSON.stringify(structuredPayload));
};
