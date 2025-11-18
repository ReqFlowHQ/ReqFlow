// FILE: backend/src/routes/collectionRoutes.ts
import express from "express";
import { protect } from "../middleware/auth";
import {
  createCollection,
  getCollections,
  deleteCollection,
} from "../controllers/collectionController";

const router = express.Router();
router.use(protect);

router.post("/", createCollection);
router.get("/", getCollections);
router.delete("/:id", deleteCollection);

export default router;
