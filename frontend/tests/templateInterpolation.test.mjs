import test from "node:test";
import assert from "node:assert/strict";
import {
  interpolateTemplateString,
  interpolateTemplateValue,
} from "../.test-dist/utils/templateInterpolation.js";

test("interpolateTemplateString replaces known variables", () => {
  const result = interpolateTemplateString(
    "https://{{host}}/v1/{{resource}}",
    { host: "api.example.com", resource: "users" }
  );
  assert.equal(result, "https://api.example.com/v1/users");
});

test("interpolateTemplateString keeps unknown placeholders", () => {
  const result = interpolateTemplateString("Bearer {{token}}", {});
  assert.equal(result, "Bearer {{token}}");
});

test("interpolateTemplateValue resolves nested objects and arrays", () => {
  const payload = {
    url: "https://{{host}}/users",
    headers: { authorization: "Bearer {{token}}" },
    list: ["{{host}}", "x"],
  };
  const result = interpolateTemplateValue(payload, {
    host: "api.reqflow.dev",
    token: "abc",
  });

  assert.deepEqual(result, {
    url: "https://api.reqflow.dev/users",
    headers: { authorization: "Bearer abc" },
    list: ["api.reqflow.dev", "x"],
  });
});

