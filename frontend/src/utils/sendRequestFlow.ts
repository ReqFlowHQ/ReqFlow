export type SendFlowAction = "execute" | "prompt";
export type ModifiedRequestChoice = "save-and-run" | "run-without-saving";

export const resolveSendFlowAction = (params: {
  isSavedRequest: boolean;
  isModified: boolean;
}): SendFlowAction => {
  if (params.isSavedRequest && params.isModified) {
    return "prompt";
  }
  return "execute";
};

export const runModifiedRequestChoice = async (params: {
  choice: ModifiedRequestChoice;
  saveAndRun: () => Promise<void>;
  runWithoutSaving: () => Promise<void>;
}) => {
  if (params.choice === "save-and-run") {
    await params.saveAndRun();
    return;
  }
  await params.runWithoutSaving();
};
