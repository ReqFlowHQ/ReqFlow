const test = require("node:test");
const assert = require("node:assert/strict");

const {
  toInterpolationVariables,
  interpolateTemplateString,
  interpolateTemplateValue,
} = require("../dist/utils/templateInterpolation");

test("toInterpolationVariables keeps flat primitive values only", () => {
  const result = toInterpolationVariables({
    host: "api.example.com",
    port: 443,
    nested: { a: 1 },
    empty: null,
    flag: true,
  });

  assert.deepEqual(result, {
    host: "api.example.com",
    port: "443",
    flag: "true",
  });
});

test("interpolateTemplateString replaces known placeholders", () => {
  const result = interpolateTemplateString("https://{{host}}/v1", {
    host: "api.reqflow.dev",
  });
  assert.equal(result, "https://api.reqflow.dev/v1");
});

test("interpolateTemplateValue resolves nested structures", () => {
  const payload = {
    headers: { authorization: "Bearer {{token}}" },
    params: { project: "{{project}}" },
    list: ["{{project}}", 1],
  };

  const result = interpolateTemplateValue(payload, {
    token: "abc",
    project: "reqflow",
  });

  assert.deepEqual(result, {
    headers: { authorization: "Bearer abc" },
    params: { project: "reqflow" },
    list: ["reqflow", 1],
  });
});

