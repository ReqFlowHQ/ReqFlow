const test = require("node:test");
const assert = require("node:assert/strict");

const { buildRequestUrlWithParams } = require("../dist/utils/requestUrl");

test("buildRequestUrlWithParams appends params", () => {
  const url = buildRequestUrlWithParams("https://example.com/search", {
    q: "reqflow",
    page: 2,
  });
  assert.equal(url, "https://example.com/search?q=reqflow&page=2");
});

test("buildRequestUrlWithParams overrides existing params", () => {
  const url = buildRequestUrlWithParams("https://example.com/search?page=1", {
    page: 3,
  });
  assert.equal(url, "https://example.com/search?page=3");
});

test("buildRequestUrlWithParams ignores empty keys and nullish values", () => {
  const url = buildRequestUrlWithParams("https://example.com", {
    "": "x",
    q: undefined,
    live: true,
  });
  assert.equal(url, "https://example.com/?live=true");
});
