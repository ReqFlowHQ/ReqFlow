const test = require("node:test");
const assert = require("node:assert/strict");

const { validateSafeHttpUrl } = require("../dist/utils/urlSafety");
const { executeRequest } = require("../dist/utils/executeRequest");

test("validateSafeHttpUrl blocks URLs with credentials", async () => {
  const result = await validateSafeHttpUrl("https://user:pass@example.com");
  assert.equal(result.ok, false);
  assert.match(result.reason, /Credentials/);
});

test("validateSafeHttpUrl blocks localhost targets", async () => {
  const result = await validateSafeHttpUrl("http://localhost:5000/internal");
  assert.equal(result.ok, false);
  assert.match(result.reason, /not allowed/i);
});

test("executeRequest blocks disallowed URL before outbound call", async () => {
  const result = await executeRequest(
    "GET",
    "http://localhost:9000/internal",
    { host: "localhost" },
    undefined
  );

  assert.equal(result.status, 400);
  assert.equal(result.statusText, "Bad Request");
  assert.equal(result.data.error, "SSRF blocked error");
  assert.equal(result.data.code, "SSRF_BLOCKED");
  assert.match(result.data.message, /Blocked URL/);
});
