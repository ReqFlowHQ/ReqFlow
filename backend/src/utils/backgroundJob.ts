export const runInBackground = (task: () => Promise<void>): void => {
  setImmediate(() => {
    void task().catch((error) => {
      console.error("Background task failed:", error);
    });
  });
};
