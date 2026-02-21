type HeadersLike = Record<string, unknown> | undefined;

export const getHeaderValue = (
  headers: HeadersLike,
  key: string
): string | undefined => {
  if (!headers) return undefined;
  const target = key.toLowerCase();
  for (const [headerKey, value] of Object.entries(headers)) {
    if (headerKey.toLowerCase() === target) {
      return typeof value === "string" ? value : String(value);
    }
  }
  return undefined;
};

export const isHtmlContentType = (contentType?: string): boolean =>
  Boolean(contentType && contentType.toLowerCase().includes("text/html"));

export const sanitizeHtmlForPreview = (rawHtml: string): string => {
  if (!rawHtml) return "";

  let sanitized = rawHtml;
  sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/<script[^>]*\/?>/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, ` $1="#"`);
  return sanitized;
};
