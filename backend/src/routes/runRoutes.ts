import express from "express";
import { protect } from "../middleware/auth";
import { getRunDiff } from "../controllers/runController";

const router = express.Router();

router.use(protect);
router.get("/:runId/diff", getRunDiff);

export default router;
