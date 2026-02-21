const test = require("node:test");
const assert = require("node:assert/strict");

const { applyAuthToRequest } = require("../dist/utils/requestAuth");

test("bearer auth injects authorization header", () => {
  const applied = applyAuthToRequest({
    auth: { type: "bearer", token: "abc" },
    headers: {},
    params: {},
  });

  assert.equal(applied.headers.authorization, "Bearer abc");
});

test("basic auth injects authorization header", () => {
  const applied = applyAuthToRequest({
    auth: { type: "basic", username: "sam", password: "pass" },
    headers: {},
    params: {},
  });

  assert.ok(String(applied.headers.authorization || "").startsWith("Basic "));
});

test("api key in header injects custom header", () => {
  const applied = applyAuthToRequest({
    auth: {
      type: "apikey",
      apiKeyName: "x-api-key",
      apiKeyValue: "k1",
      apiKeyIn: "header",
    },
    headers: {},
    params: {},
  });

  assert.equal(applied.headers["x-api-key"], "k1");
});

test("api key in query injects param", () => {
  const applied = applyAuthToRequest({
    auth: {
      type: "apikey",
      apiKeyName: "api_key",
      apiKeyValue: "k2",
      apiKeyIn: "query",
    },
    headers: {},
    params: {},
  });

  assert.equal(applied.params.api_key, "k2");
});

