import test from "node:test";
import assert from "node:assert/strict";
import { buildRequestUrlWithParams } from "../.test-dist/utils/buildRequestUrlWithParams.js";

test("adds query params to URL", () => {
  const url = buildRequestUrlWithParams("https://example.com/users", {
    page: "2",
    limit: 25,
  });
  assert.equal(url, "https://example.com/users?page=2&limit=25");
});

test("overrides existing query params with editor params", () => {
  const url = buildRequestUrlWithParams("https://example.com/users?page=1", {
    page: "3",
  });
  assert.equal(url, "https://example.com/users?page=3");
});

test("ignores empty keys and nullish values", () => {
  const url = buildRequestUrlWithParams("https://example.com", {
    "": "x",
    q: undefined,
    active: true,
  });
  assert.equal(url, "https://example.com/?active=true");
});
