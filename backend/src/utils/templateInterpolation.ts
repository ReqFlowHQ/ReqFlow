const TEMPLATE_REGEX = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;

export const toInterpolationVariables = (
  raw: unknown
): Record<string, string> => {
  if (!raw || typeof raw !== "object") return {};

  const next: Record<string, string> = {};
  for (const [keyRaw, value] of Object.entries(raw as Record<string, unknown>)) {
    const key = keyRaw.trim();
    if (!key) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === "object") continue;
    next[key] = String(value);
  }
  return next;
};

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

