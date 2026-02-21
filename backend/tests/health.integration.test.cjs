const test = require("node:test");
const assert = require("node:assert/strict");

const { createApp } = require("../dist/app");

function createMockRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

test("/api/health returns version and buildTime", () => {
  const app = createApp();
  const layer = app._router.stack.find(
    (entry) => entry.route && entry.route.path === "/api/health"
  );
  assert.ok(layer);

  const handler = layer.route.stack[0].handle;
  const req = {};
  const res = createMockRes();

  handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.payload.version, "string");
  assert.ok(res.payload.version.length > 0);
  assert.equal(typeof res.payload.buildTime, "string");
  assert.ok(!Number.isNaN(Date.parse(res.payload.buildTime)));
});
