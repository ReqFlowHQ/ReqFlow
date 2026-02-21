export type RequestAuthType = "none" | "bearer" | "apikey" | "basic";

export type RequestAuth = {
  type: RequestAuthType;
  token?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyIn?: "header" | "query";
  username?: string;
  password?: string;
};

type ApplyAuthInput = {
  auth?: RequestAuth;
  headers?: Record<string, string | number | boolean | null | undefined>;
  params?: Record<string, string | number | boolean | null | undefined>;
};

const toHeaderMap = (
  headers: Record<string, string | number | boolean | null | undefined> = {}
): Record<string, string> => {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (value === undefined || value === null) continue;
    next[key] = String(value);
  }
  return next;
};

const toParamMap = (
  params: Record<string, string | number | boolean | null | undefined> = {}
): Record<string, string> => {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null) continue;
    next[key] = String(value);
  }
  return next;
};

const encodeBasic = (username: string, password: string): string =>
  Buffer.from(`${username}:${password}`, "utf8").toString("base64");

export const applyAuthToRequest = ({
  auth,
  headers = {},
  params = {},
}: ApplyAuthInput): {
  headers: Record<string, string>;
  params: Record<string, string>;
} => {
  const nextHeaders = toHeaderMap(headers);
  const nextParams = toParamMap(params);
  const mode = auth?.type || "none";

  if (mode === "bearer") {
    const token = (auth?.token || "").trim();
    if (token) {
      nextHeaders.authorization = `Bearer ${token}`;
    }
    return { headers: nextHeaders, params: nextParams };
  }

  if (mode === "basic") {
    const username = auth?.username || "";
    const password = auth?.password || "";
    if (username || password) {
      nextHeaders.authorization = `Basic ${encodeBasic(username, password)}`;
    }
    return { headers: nextHeaders, params: nextParams };
  }

  if (mode === "apikey") {
    const key = (auth?.apiKeyName || "").trim();
    const value = auth?.apiKeyValue || "";
    const target = auth?.apiKeyIn || "header";
    if (key) {
      if (target === "query") {
        nextParams[key] = value;
      } else {
        nextHeaders[key] = value;
      }
    }
  }

  return { headers: nextHeaders, params: nextParams };
};

