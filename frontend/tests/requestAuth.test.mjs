import test from "node:test";
import assert from "node:assert/strict";
import { applyAuthToRequest } from "../.test-dist/utils/requestAuth.js";

test("bearer auth injects authorization header", () => {
  const applied = applyAuthToRequest({
    auth: { type: "bearer", token: "abc123" },
    headers: {},
    params: {},
  });
  assert.equal(applied.headers.authorization, "Bearer abc123");
});

test("basic auth injects authorization header", () => {
  const applied = applyAuthToRequest({
    auth: { type: "basic", username: "sam", password: "pass" },
    headers: {},
    params: {},
  });
  assert.ok(String(applied.headers.authorization || "").startsWith("Basic "));
});

test("api key query auth injects param", () => {
  const applied = applyAuthToRequest({
    auth: {
      type: "apikey",
      apiKeyName: "api_key",
      apiKeyValue: "k1",
      apiKeyIn: "query",
    },
    headers: {},
    params: {},
  });
  assert.equal(applied.params.api_key, "k1");
});

test("api key header auth injects header", () => {
  const applied = applyAuthToRequest({
    auth: {
      type: "apikey",
      apiKeyName: "x-api-key",
      apiKeyValue: "k2",
      apiKeyIn: "header",
    },
    headers: {},
    params: {},
  });
  assert.equal(applied.headers["x-api-key"], "k2");
});

