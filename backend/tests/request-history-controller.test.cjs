const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRequestExecutionHistory,
} = require("../dist/controllers/requestController");

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

test("getRequestExecutionHistory returns cursor-paginated history", async () => {
  let capturedQuery = null;

  const req = {
    userId: "user-1",
    params: { id: "request-1" },
    query: { limit: "2", before: "2026-02-18T16:00:00.000Z" },
    app: {
      locals: {
        repositories: {
          requests: {
            findByIdForUser: async () => ({ _id: "request-1" }),
          },
          runs: {
            listByRequest: async (_userId, _requestId, query) => {
              capturedQuery = query;
              return [
                {
                  _id: "run-3",
                  status: 200,
                  statusText: "OK",
                  durationMs: 15,
                  createdAt: "2026-02-18T15:59:00.000Z",
                },
                {
                  _id: "run-2",
                  status: 200,
                  statusText: "OK",
                  durationMs: 18,
                  createdAt: "2026-02-18T15:58:00.000Z",
                },
                {
                  _id: "run-1",
                  status: 200,
                  statusText: "OK",
                  durationMs: 21,
                  createdAt: "2026-02-18T15:57:00.000Z",
                },
              ];
            },
          },
          assertions: {},
          monitors: {},
          collections: {},
        },
      },
    },
  };
  const res = createMockRes();

  await getRequestExecutionHistory(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(capturedQuery.limit, 3);
  assert.equal(capturedQuery.before, "2026-02-18T16:00:00.000Z");
  assert.equal(res.payload.items.length, 2);
  assert.equal(res.payload.items[0]._id, "run-3");
  assert.equal(res.payload.page.limit, 2);
  assert.equal(res.payload.page.hasMore, true);
  assert.equal(res.payload.page.nextCursor, "2026-02-18T15:58:00.000Z");
});

test("getRequestExecutionHistory returns 404 when request is missing", async () => {
  let listCalled = false;

  const req = {
    userId: "user-1",
    params: { id: "missing" },
    query: {},
    app: {
      locals: {
        repositories: {
          requests: {
            findByIdForUser: async () => null,
          },
          runs: {
            listByRequest: async () => {
              listCalled = true;
              return [];
            },
          },
          assertions: {},
          monitors: {},
          collections: {},
        },
      },
    },
  };
  const res = createMockRes();

  await getRequestExecutionHistory(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.error, "Request not found");
  assert.equal(listCalled, false);
});
