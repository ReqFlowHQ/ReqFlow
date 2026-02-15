// FILE: backend/src/controllers/collectionController.ts
import { Request, Response } from "express";
import Collection from "../models/Collection";

export const createCollection = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { name, description } = req.body;
  const collection = await Collection.create({ user: userId, name, description });
  res.status(201).json(collection);
};

export const getCollections = async (req: Request, res: Response) => {
  const userId = req.userId;
  const collections = await Collection.find({ user: userId })
    .select("_id name description createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json(collections);
};

export const deleteCollection = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  await Collection.deleteOne({ _id: id, user: userId });
  res.json({ message: "Collection deleted" });
};
