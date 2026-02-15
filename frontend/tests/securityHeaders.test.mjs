import test from "node:test";
import assert from "node:assert/strict";
import { getCookieValue, shouldAttachCsrf } from "../.test-dist/securityHeaders.js";

test("getCookieValue returns matching cookie value", () => {
  const raw = "theme=dark; csrfToken=abc123; mode=dev";
  assert.equal(getCookieValue(raw, "csrfToken"), "abc123");
});

test("getCookieValue decodes encoded values", () => {
  const raw = "csrfToken=a%20b%2Bc";
  assert.equal(getCookieValue(raw, "csrfToken"), "a b+c");
});

test("getCookieValue returns null when absent", () => {
  assert.equal(getCookieValue("theme=dark", "csrfToken"), null);
});

test("shouldAttachCsrf only for mutating methods", () => {
  assert.equal(shouldAttachCsrf("GET"), false);
  assert.equal(shouldAttachCsrf("HEAD"), false);
  assert.equal(shouldAttachCsrf("POST"), true);
  assert.equal(shouldAttachCsrf("PATCH"), true);
});
