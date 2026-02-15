import dns from "dns/promises";
import net from "net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
]);

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
    const resolved = await dns.lookup(host, { all: true, verbatim: true });
    if (resolved.some((entry) => isBlockedIp(entry.address))) {
      return { ok: false, reason: "Target resolves to a private or reserved IP" };
    }
  } catch {
    return { ok: false, reason: "Unable to resolve target host" };
  }

  return { ok: true };
};
