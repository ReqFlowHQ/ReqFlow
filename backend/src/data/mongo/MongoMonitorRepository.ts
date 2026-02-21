import MonitorModel from "../../models/Monitor";
import type {
  CreateMonitorInput,
  MonitorEntity,
  UpdateMonitorInput,
} from "../entities";
import type { DeleteResult, MonitorRepository } from "../repositories/interfaces";
import { mapMongoMonitor } from "./mappers";

export class MongoMonitorRepository implements MonitorRepository {
  async create(input: CreateMonitorInput): Promise<MonitorEntity> {
    const created = await MonitorModel.create({
      user: input.user,
      request: input.request,
      name: input.name,
      scheduleCron: input.scheduleCron,
      enabled: input.enabled ?? true,
      config: input.config,
      nextRunAt: input.nextRunAt,
    });

    return mapMongoMonitor(created);
  }

  async listByUser(userId: string): Promise<MonitorEntity[]> {
    const monitors = await MonitorModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return monitors.map((monitor) => mapMongoMonitor(monitor));
  }

  async listDue(nowIso: string, limit: number): Promise<MonitorEntity[]> {
    const monitors = await MonitorModel.find({
      enabled: true,
      nextRunAt: { $lte: new Date(nowIso) },
    })
      .sort({ nextRunAt: 1 })
      .limit(limit)
      .lean();

    return monitors.map((monitor) => mapMongoMonitor(monitor));
  }

  async update(input: UpdateMonitorInput): Promise<MonitorEntity | null> {
    const updateDoc: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.enabled !== undefined) {
      updateDoc.enabled = input.enabled;
    }
    if (input.scheduleCron !== undefined) {
      updateDoc.scheduleCron = input.scheduleCron;
    }
    if (input.config !== undefined) {
      updateDoc.config = input.config;
    }
    if (input.lastRunAt !== undefined) {
      updateDoc.lastRunAt = input.lastRunAt;
    }
    if (input.nextRunAt !== undefined) {
      updateDoc.nextRunAt = input.nextRunAt;
    }

    const updated = await MonitorModel.findOneAndUpdate(
      { _id: input.monitorId, user: input.user },
      updateDoc,
      { new: true }
    ).lean();

    return updated ? mapMongoMonitor(updated) : null;
  }

  async deleteByRequest(userId: string, requestId: string): Promise<DeleteResult> {
    const result = await MonitorModel.deleteMany({ user: userId, request: requestId });
    return { deletedCount: result.deletedCount || 0 };
  }
}
