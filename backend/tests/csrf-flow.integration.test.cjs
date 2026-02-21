const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";

const authRoutes = require("../dist/routes/authRoutes").default;
const {
  ensureCsrfCookie,
  csrfAndOriginProtection,
} = require("../dist/middleware/security");

const ORIGIN = "http://localhost:3000";

function createMockRes() {
  return {
    statusCode: 200,
    payload: undefined,
    cookies: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    cookie(name, value) {
      this.cookies[name] = value;
      return this;
    },
    clearCookie() {
      return this;
    },
  };
}

function findRouteHandler(path, method) {
  const layer = authRoutes.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  assert.ok(layer);
  return layer.route.stack[0].handle;
}

test("csrf route and CSRF enforcement flow", async () => {
  const csrfReq = {
    method: "GET",
    path: "/api/auth/csrf",
    headers: { origin: ORIGIN },
    cookies: {},
  };
  const csrfRes = createMockRes();
  ensureCsrfCookie(csrfReq, csrfRes, () => {});

  const csrfHandler = findRouteHandler("/csrf", "get");
  await csrfHandler(csrfReq, csrfRes);

  assert.equal(csrfRes.statusCode, 200);
  assert.equal(typeof csrfRes.payload.csrfToken, "string");
  assert.ok(csrfRes.payload.csrfToken.length > 0);

  const logoutHandler = findRouteHandler("/logout", "post");
  const csrfToken = csrfReq.cookies.csrfToken;

  const invalidReq = {
    method: "POST",
    path: "/api/auth/logout",
    headers: { origin: ORIGIN },
    cookies: { csrfToken },
  };
  const invalidRes = createMockRes();
  csrfAndOriginProtection(invalidReq, invalidRes, () => {
    throw new Error("Should not call next without CSRF header");
  });
  assert.equal(invalidRes.statusCode, 403);
  assert.equal(invalidRes.payload.error, "Invalid CSRF token");

  const validReq = {
    method: "POST",
    path: "/api/auth/logout",
    headers: { origin: ORIGIN, "x-csrf-token": csrfToken },
    cookies: { csrfToken },
  };
  const validRes = createMockRes();

  let nextCalled = false;
  csrfAndOriginProtection(validReq, validRes, async () => {
    nextCalled = true;
    await logoutHandler(validReq, validRes);
  });

  assert.equal(nextCalled, true);
  assert.equal(validRes.statusCode, 200);
  assert.equal(validRes.payload.success, true);
});
