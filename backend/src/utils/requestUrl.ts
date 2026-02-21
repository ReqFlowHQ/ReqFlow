export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const buildRequestUrlWithParams = (
  baseUrl: string,
  params?: QueryParams
): string => {
  const trimmed = (baseUrl || "").trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    for (const [keyRaw, value] of Object.entries(params || {})) {
      const key = keyRaw.trim();
      if (!key || value === undefined || value === null) continue;
      parsed.searchParams.set(key, String(value));
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
};
