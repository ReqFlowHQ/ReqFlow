const test = require("node:test");
const assert = require("node:assert/strict");

const {
  executeRequest,
  normalizeNetworkError,
  normalizeUpstreamHttpError,
} = require("../dist/utils/executeRequest");

test("invalid domain scenario maps to DNS resolution failure", () => {
  const normalized = normalizeNetworkError({
    code: "ENOTFOUND",
    message: "getaddrinfo ENOTFOUND invalid.example",
  });

  assert.equal(normalized.status, 502);
  assert.equal(normalized.data.error, "Upstream network error");
  assert.equal(normalized.data.code, "DNS_RESOLUTION_FAILED");
});

test("closed port scenario maps to connection refused", () => {
  const normalized = normalizeNetworkError({
    code: "ECONNREFUSED",
    message: "connect ECONNREFUSED 127.0.0.1:65535",
  });

  assert.equal(normalized.status, 502);
  assert.equal(normalized.data.code, "CONNECTION_REFUSED");
});

test("timeout scenario maps to upstream timeout", () => {
  const normalized = normalizeNetworkError({
    code: "ECONNABORTED",
    message: "timeout of 15000ms exceeded",
  });

  assert.equal(normalized.status, 504);
  assert.equal(normalized.data.code, "UPSTREAM_TIMEOUT");
});

test("HTTP 404 upstream response is normalized", () => {
  const normalized = normalizeUpstreamHttpError({
    status: 404,
    statusText: "Not Found",
    data: { message: "Not found" },
    headers: { "content-type": "application/json" },
  });

  assert.equal(normalized.status, 404);
  assert.equal(normalized.data.error, "Upstream responded with error");
  assert.equal(normalized.data.status, 404);
  assert.equal(normalized.data.statusText, "Not Found");
});

test("HTTP 500 upstream response is normalized", () => {
  const normalized = normalizeUpstreamHttpError({
    status: 500,
    statusText: "Internal Server Error",
    data: { message: "boom" },
    headers: { "content-type": "application/json" },
  });

  assert.equal(normalized.status, 500);
  assert.equal(normalized.data.error, "Upstream responded with error");
  assert.equal(normalized.data.status, 500);
});

test("SSRF blocked IP is normalized by executeRequest", async () => {
  const result = await executeRequest(
    "GET",
    "http://localhost:9000/internal",
    {},
    undefined
  );

  assert.equal(result.status, 400);
  assert.equal(result.data.error, "SSRF blocked error");
  assert.equal(result.data.code, "SSRF_BLOCKED");
});
