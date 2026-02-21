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
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
  };
}

test("executeAndSave keeps raw upstream HTML for storage and returns preview payload", async () => {
  const originalExecuteRequest = executeRequestModule.executeRequest;
  const originalRunInBackground = backgroundJobModule.runInBackground;
  const originalValidateSafeHttpUrl = urlSafetyModule.validateSafeHttpUrl;

  const rawHtml = "<!doctype html><html><body><h1>Ola</h1></body></html>";
  const upstreamContentType = "text/html; charset=iso-8859-1";
  let capturedUpstreamHeaders = null;
  let capturedSavedResponse = null;
  let capturedRunInput = null;
  let backgroundTaskPromise = null;

  executeRequestModule.executeRequest = async (
    _method,
    _url,
    headers,
    _body,
    options
  ) => {
    capturedUpstreamHeaders = headers;
    if (options && typeof options.onTiming === "function") {
      options.onTiming({
        outbound_proxy_ms: 120,
        response_receive_ms: 30,
        network_ms: 150,
      });
    }
    return {
      status: 200,
      statusText: "OK",
      data: rawHtml,
      headers: { "content-type": upstreamContentType },
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
            saveResponse: async (_id, _userId, response) => {
              capturedSavedResponse = response;
              return { _id: "request-1" };
            },
          },
          runs: {
            create: async (input) => {
              capturedRunInput = input;
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
    assert.deepEqual(res.payload.data, { html: rawHtml });
    assert.equal(res.payload.headers["content-type"], upstreamContentType);

    assert.equal(capturedUpstreamHeaders["User-Agent"] !== undefined, true);
    assert.equal(capturedUpstreamHeaders.Accept, "*/*");
    assert.equal(capturedUpstreamHeaders["Accept-Language"], "en-US,en;q=0.9");

    assert.equal(capturedSavedResponse.data, rawHtml);
    assert.equal(capturedSavedResponse.headers["content-type"], upstreamContentType);
    assert.equal(capturedRunInput.response.data, rawHtml);
  } finally {
    executeRequestModule.executeRequest = originalExecuteRequest;
    backgroundJobModule.runInBackground = originalRunInBackground;
    urlSafetyModule.validateSafeHttpUrl = originalValidateSafeHttpUrl;
  }
});
