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
  const userId = (req as any).userId;
  const collections = await Collection.find({ user: userId });
  res.json(collections);
};

export const deleteCollection = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  await Collection.deleteOne({ _id: id, user: userId });
  res.json({ message: "Collection deleted" });
};
