const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { protectOptional } = require("../dist/middleware/protectOptional");
const { guestGuard } = require("../dist/middleware/guest");
const { executeAndSave } = require("../dist/controllers/requestController");
const RequestModel = require("../dist/models/Request").default;

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
  };
  return res;
}

test("authenticated user bypasses guest POST restriction via accessToken cookie", async () => {
  const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET);
  const req = {
    cookies: { accessToken: token },
    headers: {},
    body: { request: { method: "POST" } },
  };
  const res = createMockRes();

  protectOptional(req, res, () => {});
  assert.equal(req.userId, "user-1");

  let nextCalled = false;
  await guestGuard(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.notEqual(res.statusCode, 403);
});

test("guest POST request is blocked with 403", async () => {
  const req = {
    cookies: {},
    headers: {},
    body: { request: { method: "POST" } },
    socket: { remoteAddress: "203.0.113.10" },
  };
  const res = createMockRes();

  let nextCalled = false;
  await guestGuard(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload?.message, "Guest users can only execute GET requests");
});

test("executeAndSave enforces ownership filter by request id + user id", async () => {
  const originalFindOne = RequestModel.findOne;
  let capturedQuery;

  RequestModel.findOne = async (query) => {
    capturedQuery = query;
    return null;
  };

  try {
    const req = {
      userId: "owner-123",
      params: { id: "65d54f8da25ad6d3fb021111" },
    };
    const res = createMockRes();

    await executeAndSave(req, res);

    assert.deepEqual(capturedQuery, {
      _id: "65d54f8da25ad6d3fb021111",
      user: "owner-123",
    });
    assert.equal(res.statusCode, 404);
    assert.equal(res.payload?.error, "Request not found");
  } finally {
    RequestModel.findOne = originalFindOne;
  }
});
