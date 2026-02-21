import { Request, Response } from "express";
import { resolveRepositoryRegistry } from "../data/repositories/requestContext";

export const createCollection = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { name, description } = req.body;
  const repositories = resolveRepositoryRegistry(req);

  const collection = await repositories.collections.create({
    user: userId,
    name,
    description,
  });

  return res.status(201).json(collection);
};

export const getCollections = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const repositories = resolveRepositoryRegistry(req);
  const collections = await repositories.collections.listByUser(userId);
  return res.json(collections);
};

export const deleteCollection = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { id } = req.params;
  const repositories = resolveRepositoryRegistry(req);

  const collectionResult = await repositories.collections.deleteByIdForUser(
    id,
    userId
  );

  if (!collectionResult.deletedCount) {
    return res.status(404).json({ error: "Collection not found" });
  }

  const requestResult = await repositories.requests.deleteByCollectionForUser(
    userId,
    id
  );

  return res.json({
    message: "Collection deleted",
    deletedRequests: requestResult.deletedCount || 0,
  });
};
