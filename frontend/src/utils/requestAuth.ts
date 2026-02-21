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
  headers?: Record<string, string>;
  params?: Record<string, string>;
};

const encodeBase64 = (raw: string): string => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(raw);
  }
  const maybeBuffer = (globalThis as any).Buffer;
  if (maybeBuffer?.from) {
    return maybeBuffer.from(raw, "utf8").toString("base64");
  }
  return raw;
};

export const applyAuthToRequest = ({
  auth,
  headers = {},
  params = {},
}: ApplyAuthInput): { headers: Record<string, string>; params: Record<string, string> } => {
  const nextHeaders = { ...headers };
  const nextParams = { ...params };
  const mode = auth?.type || "none";

  if (mode === "bearer") {
    const token = (auth?.token || "").trim();
    if (token) {
      nextHeaders.authorization = `Bearer ${token}`;
    }
    return { headers: nextHeaders, params: nextParams };
  }

  if (mode === "basic") {
    const user = auth?.username || "";
    const pass = auth?.password || "";
    if (user || pass) {
      nextHeaders.authorization = `Basic ${encodeBase64(`${user}:${pass}`)}`;
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

