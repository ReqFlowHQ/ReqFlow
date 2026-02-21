const isMeaningfulBody = (body) => {
    if (body == null)
        return false;
    if (typeof body === "string")
        return body.trim().length > 0;
    if (typeof body !== "object")
        return true;
    if (Array.isArray(body))
        return body.length > 0;
    return Object.keys(body).length > 0;
};
const hasMeaningfulHeaders = (headers) => Boolean(headers && Object.keys(headers).some((key) => key.trim() || String(headers[key] || "").trim()));
const hasMeaningfulParams = (params) => Boolean(params && Object.keys(params).some((key) => key.trim() || String(params[key] || "").trim()));
const hasMeaningfulAuth = (auth) => {
    if (!auth || typeof auth !== "object")
        return false;
    const mode = String(auth.type || "none");
    return mode !== "none";
};
export const isMeaningfulRequestTab = (request) => {
    if (!request?.isTemporary)
        return true;
    if ((request.url || "").trim().length > 0)
        return true;
    if (hasMeaningfulParams(request.params))
        return true;
    if (hasMeaningfulAuth(request.auth))
        return true;
    if (hasMeaningfulHeaders(request.headers))
        return true;
    if (isMeaningfulBody(request.body))
        return true;
    return false;
};
export const buildPersistedTabsState = (params) => {
    const requestMap = new Map();
    for (const requests of Object.values(params.requestsByCollection || {})) {
        for (const request of requests || []) {
            requestMap.set(request._id, request);
        }
    }
    const tabs = params.activeTabIds
        .map((id) => requestMap.get(id))
        .filter((request) => Boolean(request))
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
export const restoreTabsIntoCollections = (persisted) => {
    return {
        __open_tabs__: [...(persisted.tabs || [])],
    };
};
