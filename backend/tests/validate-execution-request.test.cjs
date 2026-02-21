const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateProxyExecutionPayload,
  validateRuntimeExecutionPayload,
} = require("../dist/middleware/validateExecutionRequest");

const createResponseMock = () => {
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
  return res;
};

test("validateProxyExecutionPayload allows interpolated http URL", () => {
  const req = {
    body: {
      url: "{{base_url}}/users",
      environmentVariables: { base_url: "https://api.example.com" },
    },
  };
  const res = createResponseMock();
  let nextCalled = false;

  validateProxyExecutionPayload(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test("validateProxyExecutionPayload rejects invalid URL when interpolation unresolved", () => {
  const req = {
    body: {
      url: "{{base_url}}/users",
      environmentVariables: {},
    },
  };
  const res = createResponseMock();
  let nextCalled = false;

  validateProxyExecutionPayload(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.payload, { error: "Invalid URL" });
});

test("validateRuntimeExecutionPayload allows interpolated http URL", () => {
  const req = {
    body: {
      request: {
        method: "GET",
        url: "{{api}}/health",
      },
      environmentVariables: {
        api: "http://localhost:8080",
      },
    },
  };
  const res = createResponseMock();
  let nextCalled = false;

  validateRuntimeExecutionPayload(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

