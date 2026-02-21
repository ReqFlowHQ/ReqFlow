import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRequestUrl } from "../.test-dist/utils/normalizeRequestUrl.js";

test("keeps explicit http URL unchanged", () => {
  assert.equal(normalizeRequestUrl("http://example.com"), "http://example.com");
});

test("keeps explicit https URL unchanged", () => {
  assert.equal(normalizeRequestUrl("https://example.com"), "https://example.com");
});

test("prepends http for localhost", () => {
  assert.equal(normalizeRequestUrl("localhost:5000/api"), "http://localhost:5000/api");
});

test("prepends https for host without protocol", () => {
  assert.equal(normalizeRequestUrl("google.com"), "https://google.com");
});
