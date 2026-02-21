const test = require("node:test");
const assert = require("node:assert/strict");

const { executeAndSave } = require("../dist/controllers/requestController");
const executeRequestModule = require("../dist/utils/executeRequest");
const backgroundJobModule = require("../dist/utils/backgroundJob");
const urlSafetyModule = require("../dist/utils/urlSafety");

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

test("executeAndSave returns and persists canonical upstream latency", async () => {
  const originalExecuteRequest = executeRequestModule.executeRequest;
  const originalRunInBackground = backgroundJobModule.runInBackground;
  const originalValidateSafeHttpUrl = urlSafetyModule.validateSafeHttpUrl;

  let backgroundTaskPromise = null;
  let persistedRunCreateInput = null;

  executeRequestModule.executeRequest = async (
    _method,
    _url,
    _headers,
    _body,
    options
  ) => {
    if (options && typeof options.onTiming === "function") {
      options.onTiming({
        outbound_proxy_ms: 401.2,
        response_receive_ms: 210.3,
        network_ms: 611.5,
      });
    }
    return {
      status: 200,
      statusText: "OK",
      data: { ok: true },
      headers: { "content-type": "application/json" },
    };
  };

  backgroundJobModule.runInBackground = (task) => {
    backgroundTaskPromise = task();
  };

  urlSafetyModule.validateSafeHttpUrl = async () => ({ ok: true });

  const req = {
    userId: "user-1",
    params: { id: "request-1" },
    body: {},
    app: {
      locals: {
        repositories: {
          requests: {
            findByIdForUser: async () => ({
              _id: "request-1",
              user: "user-1",
              method: "GET",
              url: "https://example.com",
              params: {},
              headers: {},
              auth: { type: "none" },
              body: undefined,
            }),
            saveResponse: async () => ({ _id: "request-1" }),
          },
          runs: {
            create: async (input) => {
              persistedRunCreateInput = input;
              return { _id: "run-1", ...input };
            },
          },
          assertions: {
            listByRequest: async () => [],
          },
          monitors: {},
          collections: {},
        },
      },
    },
  };
  const res = createMockRes();

  try {
    await executeAndSave(req, res);
    if (backgroundTaskPromise) {
      await backgroundTaskPromise;
    }

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.latencyMs, 612);
    assert.equal(persistedRunCreateInput.durationMs, 612);
  } finally {
    executeRequestModule.executeRequest = originalExecuteRequest;
    backgroundJobModule.runInBackground = originalRunInBackground;
    urlSafetyModule.validateSafeHttpUrl = originalValidateSafeHttpUrl;
  }
});
