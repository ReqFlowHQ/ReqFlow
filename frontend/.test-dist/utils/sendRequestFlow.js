export const resolveSendFlowAction = (params) => {
    if (params.isSavedRequest && params.isModified) {
        return "prompt";
    }
    return "execute";
};
export const runModifiedRequestChoice = async (params) => {
    if (params.choice === "save-and-run") {
        await params.saveAndRun();
        return;
    }
    await params.runWithoutSaving();
};
