import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSendFlowAction,
  runModifiedRequestChoice,
} from "../.test-dist/utils/sendRequestFlow.js";

test("modified saved request resolves to prompt action", () => {
  const action = resolveSendFlowAction({
    isSavedRequest: true,
    isModified: true,
  });
  assert.equal(action, "prompt");
});

test("Save & Run persists then executes", async () => {
  const callOrder = [];

  await runModifiedRequestChoice({
    choice: "save-and-run",
    saveAndRun: async () => {
      callOrder.push("save");
      callOrder.push("run");
    },
    runWithoutSaving: async () => {
      callOrder.push("direct-run");
    },
  });

  assert.deepEqual(callOrder, ["save", "run"]);
});

test("Run Without Saving executes directly without persisting", async () => {
  const callOrder = [];

  await runModifiedRequestChoice({
    choice: "run-without-saving",
    saveAndRun: async () => {
      callOrder.push("save");
    },
    runWithoutSaving: async () => {
      callOrder.push("direct-run");
    },
  });

  assert.deepEqual(callOrder, ["direct-run"]);
});
