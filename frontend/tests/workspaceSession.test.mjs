import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWorkspaceSessionPayload,
  clearWorkspaceSession,
  isWorkspaceSessionExpired,
  loadWorkspaceSession,
  saveWorkspaceSession,
} from "../.test-dist/utils/workspaceSession.js";

const memoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

globalThis.localStorage = memoryStorage();

const req = (id, overrides = {}) => ({
  _id: id,
  name: "Req",
  method: "GET",
  url: "https://example.com",
  headers: {},
  body: {},
  isTemporary: false,
  ...overrides,
});

test("workspace restores after refresh via storage payload", () => {
  const payload = buildWorkspaceSessionPayload({
    userId: "user-a",
    activeTabIds: ["a", "b"],
    activeRequest: req("b"),
    requestsByCollection: { c1: [req("a"), req("b")] },
    now: Date.now(),
  });
  saveWorkspaceSession(payload);

  const loaded = loadWorkspaceSession("user-a");
  assert.ok(loaded);
  assert.equal(loaded.tabs.length, 2);
  assert.equal(loaded.activeTabId, "b");
});

test("workspace cleared on logout", () => {
  const payload = buildWorkspaceSessionPayload({
    userId: "user-a",
    activeTabIds: ["a"],
    activeRequest: req("a"),
    requestsByCollection: { c1: [req("a")] },
    now: Date.now(),
  });
  saveWorkspaceSession(payload);
  clearWorkspaceSession("user-a");
  assert.equal(loadWorkspaceSession("user-a"), null);
});

test("workspace session expiration is detected", () => {
  const old = buildWorkspaceSessionPayload({
    userId: "user-a",
    activeTabIds: ["a"],
    activeRequest: req("a"),
    requestsByCollection: { c1: [req("a")] },
    now: Date.now() - (31 * 60 * 1000),
  });
  assert.equal(isWorkspaceSessionExpired(old, Date.now()), true);
});

test("different users do not share workspace state", () => {
  saveWorkspaceSession(
    buildWorkspaceSessionPayload({
      userId: "user-a",
      activeTabIds: ["a"],
      activeRequest: req("a"),
      requestsByCollection: { c1: [req("a")] },
      now: Date.now(),
    })
  );
  saveWorkspaceSession(
    buildWorkspaceSessionPayload({
      userId: "user-b",
      activeTabIds: ["b"],
      activeRequest: req("b"),
      requestsByCollection: { c2: [req("b")] },
      now: Date.now(),
    })
  );

  const a = loadWorkspaceSession("user-a");
  const b = loadWorkspaceSession("user-b");
  assert.equal(a.tabs[0]._id, "a");
  assert.equal(b.tabs[0]._id, "b");
});
