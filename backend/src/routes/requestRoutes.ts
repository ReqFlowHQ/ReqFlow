import express from "express";
import { attachUser } from "../middleware/attachUser";
import { protect } from "../middleware/auth";
import { guestGuard } from "../middleware/guest";
import {
  createRequest,
  executeAndSave,
  executeTemp,
  getRequestsByCollection,
  deleteRequest,
  updateRequest,
} from "../controllers/requestController";

const router = express.Router();

/* 🌍 Guest + User */
router.post("/proxy", attachUser, guestGuard, executeTemp);

/* 🔒 Auth only */
router.use(attachUser, protect);

router.post("/", createRequest);
router.get("/collection/:collectionId", getRequestsByCollection);
router.post("/:id/execute", executeAndSave);
router.put("/:id", updateRequest);
router.delete("/:id", deleteRequest);

export default router;
