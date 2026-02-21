import dns from "dns/promises";
import net from "net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
]);
const DNS_CACHE_TTL_MS = Number(process.env.URL_SAFETY_DNS_CACHE_TTL_MS || 10000);
const DNS_CACHE_MAX_ENTRIES = Number(
  process.env.URL_SAFETY_DNS_CACHE_MAX_ENTRIES || 1000
);

type DnsCacheEntry = {
  expiresAt: number;
  addresses: string[];
};

const dnsCache = new Map<string, DnsCacheEntry>();

const readCachedAddresses = (host: string): string[] | null => {
  const cached = dnsCache.get(host);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    dnsCache.delete(host);
    return null;
  }
  return cached.addresses;
};

const writeCachedAddresses = (host: string, addresses: string[]) => {
  dnsCache.set(host, {
    expiresAt: Date.now() + DNS_CACHE_TTL_MS,
    addresses,
  });

  if (dnsCache.size > DNS_CACHE_MAX_ENTRIES) {
    const firstKey = dnsCache.keys().next().value as string | undefined;
    if (firstKey) dnsCache.delete(firstKey);
  }
};

const isPrivateIPv4 = (ip: string): boolean => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
};

const isPrivateIPv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe8")) return true;
  if (normalized.startsWith("fe9")) return true;
  if (normalized.startsWith("fea")) return true;
  if (normalized.startsWith("feb")) return true;
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.replace("::ffff:", "");
    return isPrivateIPv4(mapped);
  }
  return false;
};

const isBlockedIp = (ip: string): boolean => {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true;
};

export const validateSafeHttpUrl = async (
  rawUrl: string
): Promise<{ ok: true } | { ok: false; reason: string }> => {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only HTTP/HTTPS URLs are allowed" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "Credentials in URL are not allowed" };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    return { ok: false, reason: "Target host is not allowed" };
  }

  if (parsed.port) {
    const port = Number(parsed.port);
    if (!Number.isFinite(port) || port <= 0 || port > 65535) {
      return { ok: false, reason: "Invalid target port" };
    }
  }

  if (net.isIP(host) && isBlockedIp(host)) {
    return { ok: false, reason: "Target IP is private or reserved" };
  }

  try {
    const cachedAddresses = readCachedAddresses(host);
    const addresses =
      cachedAddresses ||
      (await dns.lookup(host, { all: true, verbatim: true })).map(
        (entry) => entry.address
      );

    if (!cachedAddresses) {
      writeCachedAddresses(host, addresses);
    }

    if (addresses.some((address) => isBlockedIp(address))) {
      return { ok: false, reason: "Target resolves to a private or reserved IP" };
    }
  } catch {
    return { ok: false, reason: "Unable to resolve target host" };
  }

  return { ok: true };
};
