export type RequestSnapshot = {
  method: string;
  url: string;
  params: Record<string, string>;
  auth: string;
  headers: Record<string, string>;
  body: string;
};

type ComparableRequest = {
  method?: string;
  url?: string;
  params?: Record<string, unknown>;
  auth?: unknown;
  headers?: Record<string, unknown>;
  body?: unknown;
};

const normalizeHeaders = (headers: Record<string, unknown> = {}): Record<string, string> => {
  const normalized = Object.entries(headers).map(([key, value]) => [
    key.trim().toLowerCase(),
    value == null ? "" : String(value),
  ]);
  normalized.sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(normalized);
};

const stableSerialize = (value: unknown): string => {
  if (value === undefined) return "";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const serialized = keys.map((key) => `"${key}":${stableSerialize(record[key])}`);
  return `{${serialized.join(",")}}`;
};

export const createRequestSnapshot = (request: ComparableRequest): RequestSnapshot => ({
  method: (request.method || "GET").toUpperCase(),
  url: (request.url || "").trim(),
  params: normalizeHeaders(request.params || {}),
  auth: stableSerialize(request.auth),
  headers: normalizeHeaders(request.headers || {}),
  body: stableSerialize(request.body),
});

export const isRequestModified = (
  snapshot: RequestSnapshot | undefined,
  request: ComparableRequest
): boolean => {
  if (!snapshot) return false;
  const current = createRequestSnapshot(request);
  return (
    snapshot.method !== current.method ||
    snapshot.url !== current.url ||
    JSON.stringify(snapshot.params) !== JSON.stringify(current.params) ||
    snapshot.auth !== current.auth ||
    JSON.stringify(snapshot.headers) !== JSON.stringify(current.headers) ||
    snapshot.body !== current.body
  );
};
