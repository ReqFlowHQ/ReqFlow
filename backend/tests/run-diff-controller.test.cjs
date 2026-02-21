const test = require("node:test");
const assert = require("node:assert/strict");

const { getRunDiff } = require("../dist/controllers/runController");

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

const createRun = (id, requestId, response) => ({
  _id: id,
  user: "user-1",
  request: requestId,
  status: 200,
  statusText: "OK",
  durationMs: 10,
  response,
  assertionResults: [],
  createdAt: "2026-02-18T10:00:00.000Z",
  updatedAt: "2026-02-18T10:00:00.000Z",
});

test("getRunDiff returns deep JSON diff when both payloads are JSON", async () => {
  const runA = createRun("run-a", "request-1", {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    data: {
      version: 1,
      nested: { stable: true, change: "before" },
      removedField: "x",
    },
  });
  const runB = createRun("run-b", "request-1", {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    data: {
      version: 2,
      nested: { stable: true, change: "after" },
      addedField: "y",
    },
  });

  const req = {
    userId: "user-1",
    params: { runId: "run-a" },
    query: { compareTo: "run-b" },
    app: {
      locals: {
        repositories: {
          runs: {
            findByIdForUser: async (id) => (id === "run-a" ? runA : runB),
          },
        },
      },
    },
  };
  const res = createMockRes();

  await getRunDiff(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.mode, "json");
  assert.equal(res.payload.summary.changed >= 2, true);
  assert.equal(
    res.payload.json.entries.some((entry) => entry.path === "$.version"),
    true
  );
  assert.equal(
    res.payload.json.entries.some((entry) => entry.path === "$.addedField"),
    true
  );
});

test("getRunDiff falls back to line diff for non-JSON responses", async () => {
  const runA = createRun("run-a", "request-1", {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "text/plain" },
    data: { text: "line one\nline two" },
  });
  const runB = createRun("run-b", "request-1", {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "text/plain" },
    data: { text: "line one\nline two updated\nline three" },
  });

  const req = {
    userId: "user-1",
    params: { runId: "run-a" },
    query: { compareTo: "run-b" },
    app: {
      locals: {
        repositories: {
          runs: {
            findByIdForUser: async (id) => (id === "run-a" ? runA : runB),
          },
        },
      },
    },
  };
  const res = createMockRes();

  await getRunDiff(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.mode, "text");
  assert.equal(res.payload.summary.added > 0, true);
  assert.equal(res.payload.summary.removed > 0, true);
  assert.equal(
    res.payload.text.lines.some((line) => line.type === "added"),
    true
  );
});

test("getRunDiff validates compareTo and run ownership constraints", async () => {
  const reqMissingCompare = {
    userId: "user-1",
    params: { runId: "run-a" },
    query: {},
    app: {
      locals: {
        repositories: {
          runs: {
            findByIdForUser: async () => null,
          },
        },
      },
    },
  };
  const missingCompareRes = createMockRes();
  await getRunDiff(reqMissingCompare, missingCompareRes);
  assert.equal(missingCompareRes.statusCode, 400);
  assert.equal(
    missingCompareRes.payload.error,
    "compareTo query param is required"
  );

  const reqCrossRequest = {
    userId: "user-1",
    params: { runId: "run-a" },
    query: { compareTo: "run-b" },
    app: {
      locals: {
        repositories: {
          runs: {
            findByIdForUser: async (id) =>
              id === "run-a"
                ? createRun("run-a", "request-1", {
                    status: 200,
                    statusText: "OK",
                    headers: { "content-type": "application/json" },
                    data: { value: "a" },
                  })
                : createRun("run-b", "request-2", {
                    status: 200,
                    statusText: "OK",
                    headers: { "content-type": "application/json" },
                    data: { value: "b" },
                  }),
          },
        },
      },
    },
  };
  const crossRequestRes = createMockRes();
  await getRunDiff(reqCrossRequest, crossRequestRes);
  assert.equal(crossRequestRes.statusCode, 400);
  assert.equal(crossRequestRes.payload.error, "Runs must belong to the same request");
});
