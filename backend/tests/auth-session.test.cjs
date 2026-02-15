const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";

const RefreshSession = require("../dist/models/RefreshSession").default;
const { hashRefreshToken } = require("../dist/models/RefreshSession");
const {
  rotateRefreshToken,
  revokeRefreshToken,
} = require("../dist/services/authSession");

test("rotateRefreshToken rotates session and revokes previous refresh token", async () => {
  const originalFindOne = RefreshSession.findOne;
  const originalCreate = RefreshSession.create;
  const originalUpdateOne = RefreshSession.updateOne;

  const updates = [];
  const creates = [];

  const oldToken = jwt.sign(
    { userId: "user-1", jti: "jti-old", type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );

  RefreshSession.findOne = async (query) => {
    assert.equal(query.jti, "jti-old");
    return {
      _id: "session-1",
      user: "user-1",
      jti: "jti-old",
      tokenHash: hashRefreshToken(oldToken),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      revokedAt: null,
    };
  };
  RefreshSession.create = async (doc) => {
    creates.push(doc);
    return doc;
  };
  RefreshSession.updateOne = async (query, update) => {
    updates.push({ query, update });
    return { acknowledged: true };
  };

  try {
    const result = await rotateRefreshToken(oldToken, {
      headers: { "user-agent": "node-test" },
      remoteAddress: "203.0.113.9",
    });

    assert.equal(result.ok, true);
    assert.equal(typeof result.accessToken, "string");
    assert.equal(typeof result.refreshToken, "string");
    assert.equal(creates.length, 1);
    assert.equal(updates.length, 1);
    assert.equal(updates[0].query._id, "session-1");
    assert.ok(updates[0].update.$set.revokedAt instanceof Date);
    assert.ok(updates[0].update.$set.replacedByJti);
  } finally {
    RefreshSession.findOne = originalFindOne;
    RefreshSession.create = originalCreate;
    RefreshSession.updateOne = originalUpdateOne;
  }
});

test("revokeRefreshToken revokes active refresh session", async () => {
  const originalUpdateOne = RefreshSession.updateOne;
  let captured = null;

  const token = jwt.sign(
    { userId: "user-1", jti: "jti-revoke", type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );

  RefreshSession.updateOne = async (query, update) => {
    captured = { query, update };
    return { acknowledged: true };
  };

  try {
    await revokeRefreshToken(token);
    assert.ok(captured);
    assert.equal(captured.query.jti, "jti-revoke");
    assert.ok(captured.update.$set.revokedAt instanceof Date);
  } finally {
    RefreshSession.updateOne = originalUpdateOne;
  }
});
