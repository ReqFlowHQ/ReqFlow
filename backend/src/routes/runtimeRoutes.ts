import { Router } from "express";
import { executeRuntime } from "../controllers/runtimeController";
import { protect } from "../middleware/auth";
import { guestGuard } from "../middleware/guest";
import { validateRuntimeExecutionPayload } from "../middleware/validateExecutionRequest";
const router = Router();

/**
 * Guest + Auth users (runtime execution)
 * Guest: GET only (limited)
 * Auth: full
 */
router.post(
  "/execute",
  validateRuntimeExecutionPayload,
  guestGuard,        // enforce guest rules ONLY if not logged in
  executeRuntime
);


/**
 * Saved requests (auth only)
 */
router.post(
  "/:id/execute",
  protect,
  executeRuntime
);

export default router;
