export const WORKSPACE_SESSION_VERSION = 1;
export const WORKSPACE_INACTIVITY_MS = 30 * 60 * 1000;
const RESPONSE_SIZE_LIMIT_BYTES = 1024 * 1024;
const STORAGE_PREFIX = "reqflow-workspace:v1:";
const keyForUser = (userId) => `${STORAGE_PREFIX}${userId}`;
const safeJsonParse = (value) => {
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
};
const cloneJsonSafe = (value) => JSON.parse(JSON.stringify(value));
const byteSize = (value) => {
    try {
        return new TextEncoder().encode(JSON.stringify(value)).length;
    }
    catch {
        return Number.MAX_SAFE_INTEGER;
    }
};
const sanitizeResponse = (response) => {
    if (!response)
        return response;
    if (byteSize(response) <= RESPONSE_SIZE_LIMIT_BYTES) {
        return response;
    }
    const base = typeof response === "object" && response !== null
        ? response
        : {};
    return {
        status: base.status ?? null,
        statusText: base.statusText ?? "Response truncated",
        time: base.time ?? null,
        headers: base.headers ?? {},
        data: { omitted: true, reason: "Response too large to persist" },
    };
};
const isMeaningfulTab = (tab) => {
    if (!tab.isTemporary)
        return true;
    if ((tab.url || "").trim().length > 0)
        return true;
    if (tab.params && Object.keys(tab.params).length > 0)
        return true;
    if (tab.auth && typeof tab.auth === "object" && String(tab.auth.type || "none") !== "none")
        return true;
    if ((tab.name || "").trim().length > 0 && tab.name !== "New Request")
        return true;
    if (tab.headers && Object.keys(tab.headers).length > 0)
        return true;
    if (tab.body && (typeof tab.body !== "object" || Object.keys(tab.body).length > 0))
        return true;
    if (tab.response)
        return true;
    return false;
};
export const buildWorkspaceSessionPayload = (params) => {
    const map = new Map();
    for (const list of Object.values(params.requestsByCollection || {})) {
        for (const request of list || []) {
            map.set(request._id, request);
        }
    }
    const tabs = params.activeTabIds
        .map((id) => map.get(id))
        .filter((tab) => Boolean(tab))
        .filter(isMeaningfulTab)
        .map((tab) => ({
        ...tab,
        response: sanitizeResponse(tab.response),
    }));
    const activeTabId = params.activeRequest?._id && tabs.some((tab) => tab._id === params.activeRequest?._id)
        ? params.activeRequest._id
        : tabs[0]?._id || null;
    return {
        version: WORKSPACE_SESSION_VERSION,
        userId: params.userId,
        lastActivityAt: params.now ?? Date.now(),
        activeTabId,
        tabs: cloneJsonSafe(tabs),
    };
};
export const saveWorkspaceSession = (payload) => {
    localStorage.setItem(keyForUser(payload.userId), JSON.stringify(payload));
};
export const loadWorkspaceSession = (userId) => {
    const raw = localStorage.getItem(keyForUser(userId));
    if (!raw)
        return null;
    const parsed = safeJsonParse(raw);
    if (!parsed || parsed.version !== WORKSPACE_SESSION_VERSION || parsed.userId !== userId) {
        return null;
    }
    return parsed;
};
export const clearWorkspaceSession = (userId) => {
    localStorage.removeItem(keyForUser(userId));
};
export const isWorkspaceSessionExpired = (payload, now = Date.now()) => now - payload.lastActivityAt > WORKSPACE_INACTIVITY_MS;
