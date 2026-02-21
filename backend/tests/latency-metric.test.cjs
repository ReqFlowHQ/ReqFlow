const test = require("node:test");
const assert = require("node:assert/strict");

const { toCanonicalLatencyMs } = require("../dist/utils/performanceMetrics");

test("toCanonicalLatencyMs prefers network_ms for canonical latency", () => {
  const latencyMs = toCanonicalLatencyMs({
    outbound_proxy_ms: 300.2,
    response_receive_ms: 120.4,
    network_ms: 987.6,
  });

  assert.equal(latencyMs, 988);
});

test("toCanonicalLatencyMs falls back to outbound+receive when network_ms missing", () => {
  const latencyMs = toCanonicalLatencyMs({
    outbound_proxy_ms: 200.4,
    response_receive_ms: 99.5,
  });

  assert.equal(latencyMs, 300);
});

test("toCanonicalLatencyMs guards invalid values", () => {
  assert.equal(
    toCanonicalLatencyMs({
      outbound_proxy_ms: Number.NaN,
      response_receive_ms: Number.NaN,
      network_ms: Number.NaN,
    }),
    0
  );
  assert.equal(toCanonicalLatencyMs(undefined), 0);
});
