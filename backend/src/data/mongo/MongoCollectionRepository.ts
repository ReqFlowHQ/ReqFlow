import CollectionModel from "../../models/Collection";
import type { CollectionRepository, DeleteResult } from "../repositories/interfaces";
import type { CollectionEntity, CreateCollectionInput } from "../entities";
import { mapMongoCollection } from "./mappers";

export class MongoCollectionRepository implements CollectionRepository {
  async create(input: CreateCollectionInput): Promise<CollectionEntity> {
    const created = await CollectionModel.create({
      user: input.user,
      name: input.name,
      description: input.description,
    });

    return mapMongoCollection(created);
  }

  async listByUser(userId: string): Promise<CollectionEntity[]> {
    const collections = await CollectionModel.find({ user: userId })
      .select("_id user name description createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return collections.map((collection) => mapMongoCollection(collection));
  }

  async deleteByIdForUser(id: string, userId: string): Promise<DeleteResult> {
    const result = await CollectionModel.deleteOne({ _id: id, user: userId });
    return { deletedCount: result.deletedCount || 0 };
  }
}
