import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPersistedTabsState,
  restoreTabsIntoCollections,
} from "../.test-dist/utils/tabPersistence.js";

const req = (id, overrides = {}) => ({
  _id: id,
  name: "New Request",
  method: "GET",
  url: "",
  headers: {},
  body: {},
  isTemporary: true,
  ...overrides,
});

test("persists multiple open tabs with active tab", () => {
  const tab1 = req("tab-1", { url: "https://a.com" });
  const tab2 = req("tab-2", { method: "POST", body: { a: 1 } });

  const persisted = buildPersistedTabsState({
    activeTabIds: ["tab-1", "tab-2"],
    activeRequest: tab2,
    requestsByCollection: { __temp__: [tab1, tab2] },
  });

  assert.equal(persisted.tabs.length, 2);
  assert.equal(persisted.activeTabId, "tab-2");
});

test("ignores empty default temporary tab", () => {
  const empty = req("empty-tab");
  const persisted = buildPersistedTabsState({
    activeTabIds: ["empty-tab"],
    activeRequest: empty,
    requestsByCollection: { __temp__: [empty] },
  });

  assert.equal(persisted.tabs.length, 0);
  assert.equal(persisted.activeTabId, null);
});

test("restores persisted tabs into open-tab collection bucket", () => {
  const tab1 = req("tab-1", { url: "https://a.com" });
  const tab2 = req("tab-2", { url: "https://b.com" });
  const restored = restoreTabsIntoCollections({
    version: 1,
    activeTabId: "tab-2",
    tabs: [tab1, tab2],
  });

  assert.equal(Array.isArray(restored.__open_tabs__), true);
  assert.equal(restored.__open_tabs__.length, 2);
  assert.equal(restored.__open_tabs__[1]._id, "tab-2");
});

test("closing a tab updates persistence payload", () => {
  const tab1 = req("tab-1", { url: "https://a.com" });
  const tab2 = req("tab-2", { url: "https://b.com" });

  const before = buildPersistedTabsState({
    activeTabIds: ["tab-1", "tab-2"],
    activeRequest: tab2,
    requestsByCollection: { __temp__: [tab1, tab2] },
  });
  assert.equal(before.tabs.length, 2);

  const after = buildPersistedTabsState({
    activeTabIds: ["tab-2"],
    activeRequest: tab2,
    requestsByCollection: { __temp__: [tab1, tab2] },
  });
  assert.equal(after.tabs.length, 1);
  assert.equal(after.tabs[0]._id, "tab-2");
});
