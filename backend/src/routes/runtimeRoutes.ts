import { Router } from "express";
import { executeRuntime } from "../controllers/runtimeController";
import { protect } from "../middleware/auth";
import { guestGuard } from "../middleware/guest";
import { protectOptional } from "../middleware/protectOptional";
const router = Router();

/**
 * Guest + Auth users (runtime execution)
 * Guest: GET only (limited)
 * Auth: full
 */
router.post(
  "/execute",
  protectOptional,   // detect auth but don’t block
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

