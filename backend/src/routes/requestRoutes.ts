import express from "express";
import { protect } from "../middleware/auth";
import { guestGuard } from "../middleware/guest";
import { validateProxyExecutionPayload } from "../middleware/validateExecutionRequest";
import {
  createRequest,
  executeAndSave,
  executeTemp,
  getRequestsByCollection,
  getRequestExecutionHistory,
  deleteRequest,
  updateRequest,
} from "../controllers/requestController";

const router = express.Router();

/* 🌍 Guest + User */
router.post("/proxy", validateProxyExecutionPayload, guestGuard, executeTemp);

/* 🔒 Auth only */
router.use(protect);

router.post("/", createRequest);
router.get("/collection/:collectionId", getRequestsByCollection);
router.get("/:id/history", getRequestExecutionHistory);
router.post("/:id/execute", executeAndSave);
router.put("/:id", updateRequest);
router.delete("/:id", deleteRequest);

export default router;
