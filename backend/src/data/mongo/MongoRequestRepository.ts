import RequestModel from "../../models/Request";
import type { StoredResponse, UpdateRequestInput } from "../entities";
import { mapMongoRequest } from "./mappers";
import type { DeleteResult, RequestRepository } from "../repositories/interfaces";
import type { CreateRequestInput, RequestEntity } from "../entities";

export class MongoRequestRepository implements RequestRepository {
  async create(input: CreateRequestInput): Promise<RequestEntity> {
    const created = await RequestModel.create({
      user: input.user,
      collection: input.collection,
      name: input.name,
      method: input.method,
      url: input.url,
      params: input.params || {},
      auth: input.auth || { type: "none" },
      headers: input.headers || {},
      body: input.body,
    });

    return mapMongoRequest(created);
  }

  async findByIdForUser(id: string, userId: string): Promise<RequestEntity | null> {
    const found = await RequestModel.findOne({ _id: id, user: userId });
    return found ? mapMongoRequest(found) : null;
  }

  async listByCollection(userId: string, collectionId: string, limit: number): Promise<RequestEntity[]> {
    const requests = await RequestModel.find({ user: userId, collection: collectionId })
      .select("name method url params auth headers body response collection createdAt updatedAt user")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return requests.map((request) => mapMongoRequest(request));
  }

  async updateByIdForUser(
    id: string,
    userId: string,
    updates: UpdateRequestInput
  ): Promise<RequestEntity | null> {
    const updateDoc: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates || {})) {
      if (value !== undefined) {
        updateDoc[key] = value;
      }
    }

    const updated = await RequestModel.findOneAndUpdate(
      { _id: id, user: userId },
      updateDoc,
      { new: true }
    ).lean();

    return updated ? mapMongoRequest(updated) : null;
  }

  async saveResponse(id: string, userId: string, response: StoredResponse): Promise<RequestEntity | null> {
    const updated = await RequestModel.findOneAndUpdate(
      { _id: id, user: userId },
      { response, updatedAt: new Date() },
      { new: true }
    ).lean();

    return updated ? mapMongoRequest(updated) : null;
  }

  async deleteByIdForUser(id: string, userId: string): Promise<DeleteResult> {
    const result = await RequestModel.deleteOne({ _id: id, user: userId });
    return { deletedCount: result.deletedCount || 0 };
  }

  async deleteByCollectionForUser(userId: string, collectionId: string): Promise<DeleteResult> {
    const result = await RequestModel.deleteMany({ user: userId, collection: collectionId });
    return { deletedCount: result.deletedCount || 0 };
  }
}
