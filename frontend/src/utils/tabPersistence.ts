import type { RequestAuth } from "./requestAuth.js";

export type PersistableRequestItem = {
  _id: string;
  name: string;
  method: string;
  url: string;
  params?: Record<string, string>;
  auth?: RequestAuth;
  headers: Record<string, string>;
  body?: any;
  response?: any;
  collection?: string | null;
  isTemporary?: boolean;
};

export type PersistedTabsState = {
  version: 1;
  activeTabId: string | null;
  tabs: PersistableRequestItem[];
};

const isMeaningfulBody = (body: unknown): boolean => {
  if (body == null) return false;
  if (typeof body === "string") return body.trim().length > 0;
  if (typeof body !== "object") return true;
  if (Array.isArray(body)) return body.length > 0;
  return Object.keys(body as Record<string, unknown>).length > 0;
};

const hasMeaningfulHeaders = (headers?: Record<string, string>): boolean =>
  Boolean(headers && Object.keys(headers).some((key) => key.trim() || String(headers[key] || "").trim()));

const hasMeaningfulParams = (params?: Record<string, string>): boolean =>
  Boolean(params && Object.keys(params).some((key) => key.trim() || String(params[key] || "").trim()));

const hasMeaningfulAuth = (auth?: RequestAuth): boolean => {
  if (!auth || typeof auth !== "object") return false;
  const mode = String(auth.type || "none");
  return mode !== "none";
};

export const isMeaningfulRequestTab = (request: PersistableRequestItem): boolean => {
  if (!request?.isTemporary) return true;
  if ((request.url || "").trim().length > 0) return true;
  if (hasMeaningfulParams(request.params)) return true;
  if (hasMeaningfulAuth(request.auth)) return true;
  if (hasMeaningfulHeaders(request.headers)) return true;
  if (isMeaningfulBody(request.body)) return true;
  return false;
};

export const buildPersistedTabsState = (params: {
  activeTabIds: string[];
  activeRequest: PersistableRequestItem | null | undefined;
  requestsByCollection: Record<string, PersistableRequestItem[]>;
}): PersistedTabsState => {
  const requestMap = new Map<string, PersistableRequestItem>();
  for (const requests of Object.values(params.requestsByCollection || {})) {
    for (const request of requests || []) {
      requestMap.set(request._id, request);
    }
  }

  const tabs = params.activeTabIds
    .map((id) => requestMap.get(id))
    .filter((request): request is PersistableRequestItem => Boolean(request))
    .filter(isMeaningfulRequestTab)
    .slice(0, 30);

  const activeTabId = params.activeRequest?._id && tabs.some((tab) => tab._id === params.activeRequest?._id)
    ? params.activeRequest._id
    : tabs[0]?._id || null;

  return {
    version: 1,
    activeTabId,
    tabs,
  };
};

export const restoreTabsIntoCollections = (
  persisted: PersistedTabsState
): Record<string, PersistableRequestItem[]> => {
  return {
    __open_tabs__: [...(persisted.tabs || [])],
  };
};
