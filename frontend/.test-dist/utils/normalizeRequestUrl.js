export const normalizeRequestUrl = (rawUrl) => {
    const trimmed = (rawUrl || "").trim();
    if (!trimmed)
        return trimmed;
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    if (/^localhost(?::\d+)?(?:\/|$)/i.test(trimmed)) {
        return `http://${trimmed}`;
    }
    return `https://${trimmed}`;
};
