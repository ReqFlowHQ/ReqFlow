import AssertionModel from "../../models/Assertion";
import type { AssertionEntity, CreateAssertionInput } from "../entities";
import type { AssertionRepository, DeleteResult } from "../repositories/interfaces";
import { mapMongoAssertion } from "./mappers";

export class MongoAssertionRepository implements AssertionRepository {
  async create(input: CreateAssertionInput): Promise<AssertionEntity> {
    const created = await AssertionModel.create({
      user: input.user,
      request: input.request,
      name: input.name,
      rule: input.rule,
      enabled: input.enabled ?? true,
    });

    return mapMongoAssertion(created);
  }

  async listByRequest(userId: string, requestId: string): Promise<AssertionEntity[]> {
    const assertions = await AssertionModel.find({ user: userId, request: requestId })
      .sort({ updatedAt: -1 })
      .lean();

    return assertions.map((assertion) => mapMongoAssertion(assertion));
  }

  async deleteByRequest(userId: string, requestId: string): Promise<DeleteResult> {
    const result = await AssertionModel.deleteMany({ user: userId, request: requestId });
    return { deletedCount: result.deletedCount || 0 };
  }
}
