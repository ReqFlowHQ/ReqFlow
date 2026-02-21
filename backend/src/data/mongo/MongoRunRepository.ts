import RunModel from "../../models/Run";
import type { CreateRunInput, RunEntity } from "../entities";
import type { DeleteResult, RunRepository } from "../repositories/interfaces";
import { mapMongoRun } from "./mappers";

export class MongoRunRepository implements RunRepository {
  async create(input: CreateRunInput): Promise<RunEntity> {
    const created = await RunModel.create({
      user: input.user,
      request: input.request,
      status: input.status,
      statusText: input.statusText,
      durationMs: input.durationMs,
      response: input.response,
      assertionResults: input.assertionResults || [],
    });

    return mapMongoRun(created);
  }

  async findByIdForUser(id: string, userId: string): Promise<RunEntity | null> {
    try {
      const run = await RunModel.findOne({ _id: id, user: userId }).lean();
      return run ? mapMongoRun(run) : null;
    } catch {
      return null;
    }
  }

  async listByRequest(
    userId: string,
    requestId: string,
    query: { limit: number; before?: string }
  ): Promise<RunEntity[]> {
    const filter: Record<string, unknown> = { user: userId, request: requestId };
    if (query.before) {
      const beforeDate = new Date(query.before);
      if (!Number.isNaN(beforeDate.valueOf())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    const runs = await RunModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit)
      .lean();

    return runs.map((run) => mapMongoRun(run));
  }

  async deleteByRequest(userId: string, requestId: string): Promise<DeleteResult> {
    const result = await RunModel.deleteMany({ user: userId, request: requestId });
    return { deletedCount: result.deletedCount || 0 };
  }
}
