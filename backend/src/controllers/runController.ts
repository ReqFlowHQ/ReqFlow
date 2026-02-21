import { Request, Response } from "express";
import { resolveRepositoryRegistry } from "../data/repositories/requestContext";
import { buildRunResponseDiff } from "../utils/responseDiff";

export const getRunDiff = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const runId = String(req.params.runId || "").trim();
    const compareTo =
      typeof req.query.compareTo === "string" ? req.query.compareTo.trim() : "";

    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }

    if (!compareTo) {
      return res.status(400).json({ error: "compareTo query param is required" });
    }

    if (compareTo === runId) {
      return res
        .status(400)
        .json({ error: "compareTo must be different from runId" });
    }

    const repositories = resolveRepositoryRegistry(req);
    const [run, compareRun] = await Promise.all([
      repositories.runs.findByIdForUser(runId, userId),
      repositories.runs.findByIdForUser(compareTo, userId),
    ]);

    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

    if (!compareRun) {
      return res.status(404).json({ error: "Compare run not found" });
    }

    if (String(run.request) !== String(compareRun.request)) {
      return res
        .status(400)
        .json({ error: "Runs must belong to the same request" });
    }

    const diff = buildRunResponseDiff(run, compareRun);
    return res.json(diff);
  } catch (err) {
    console.error("Error generating run diff:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
