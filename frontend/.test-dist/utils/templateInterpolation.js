const TEMPLATE_REGEX = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;
export const interpolateTemplateString = (value, variables) => String(value || "").replace(TEMPLATE_REGEX, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
        return variables[key];
    }
    return match;
});
export const interpolateTemplateValue = (value, variables) => {
    if (typeof value === "string") {
        return interpolateTemplateString(value, variables);
    }
    if (Array.isArray(value)) {
        return value.map((item) => interpolateTemplateValue(item, variables));
    }
    if (value && typeof value === "object") {
        const obj = value;
        const next = {};
        for (const [key, child] of Object.entries(obj)) {
            next[key] = interpolateTemplateValue(child, variables);
        }
        return next;
    }
    return value;
};
export const resolveRequestTemplates = (input, variables) => ({
    url: interpolateTemplateString(input.url || "", variables),
    params: interpolateTemplateValue(input.params || {}, variables),
    headers: interpolateTemplateValue(input.headers || {}, variables),
    body: interpolateTemplateValue(input.body, variables),
    auth: interpolateTemplateValue(input.auth || { type: "none" }, variables),
});
