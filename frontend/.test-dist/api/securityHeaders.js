export const getCookieValue = (cookieHeader, name) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = cookieHeader.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
};
export const shouldAttachCsrf = (method) => {
    const normalized = (method || "GET").toUpperCase();
    return ["POST", "PUT", "PATCH", "DELETE"].includes(normalized);
};
