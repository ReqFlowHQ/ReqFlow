const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ensureCsrfCookie,
  csrfAndOriginProtection,
} = require("../dist/middleware/security");

function createMockRes() {
  const state = {
    statusCode: 200,
    payload: undefined,
    cookies: [],
  };
  return {
    state,
    cookie(name, value, options) {
      state.cookies.push({ name, value, options });
      return this;
    },
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(body) {
      state.payload = body;
      return this;
    },
  };
}

test("ensureCsrfCookie sets csrf cookie when missing", () => {
  const req = { cookies: {} };
  const res = createMockRes();
  let nextCalled = false;

  ensureCsrfCookie(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.state.cookies.length, 1);
  assert.equal(res.state.cookies[0].name, "csrfToken");
});

test("csrfAndOriginProtection blocks mutating request without matching token", () => {
  const req = {
    method: "POST",
    path: "/api/requests",
    headers: {
      origin: "http://localhost:3000",
    },
    cookies: {
      csrfToken: "cookie-token",
    },
  };
  const res = createMockRes();
  let nextCalled = false;

  csrfAndOriginProtection(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.state.statusCode, 403);
  assert.equal(res.state.payload.error, "Invalid CSRF token");
});

test("csrfAndOriginProtection allows trusted origin with matching token", () => {
  const req = {
    method: "DELETE",
    path: "/api/requests/1",
    headers: {
      origin: "http://localhost:3000",
      "x-csrf-token": "csrf-token",
    },
    cookies: {
      csrfToken: "csrf-token",
    },
  };
  const res = createMockRes();
  let nextCalled = false;

  csrfAndOriginProtection(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.state.statusCode, 200);
});
