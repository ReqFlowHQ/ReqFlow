import type { RequestAuth } from "./requestAuth.js";

const TEMPLATE_REGEX = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;

export const interpolateTemplateString = (
  value: string,
  variables: Record<string, string>
): string =>
  String(value || "").replace(TEMPLATE_REGEX, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key];
    }
    return match;
  });

export const interpolateTemplateValue = <T>(
  value: T,
  variables: Record<string, string>
): T => {
  if (typeof value === "string") {
    return interpolateTemplateString(value, variables) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateTemplateValue(item, variables)) as T;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(obj)) {
      next[key] = interpolateTemplateValue(child, variables);
    }
    return next as T;
  }
  return value;
};

export const resolveRequestTemplates = (
  input: {
    url: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    body?: unknown;
    auth?: RequestAuth;
  },
  variables: Record<string, string>
) => ({
  url: interpolateTemplateString(input.url || "", variables),
  params: interpolateTemplateValue(input.params || {}, variables),
  headers: interpolateTemplateValue(input.headers || {}, variables),
  body: interpolateTemplateValue(input.body, variables),
  auth: interpolateTemplateValue(input.auth || { type: "none" }, variables) as RequestAuth,
});
