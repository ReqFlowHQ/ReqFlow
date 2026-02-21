import type {
  CreateMonitorInput,
  MonitorEntity,
  UpdateMonitorInput,
} from "../entities";
import { generateObjectIdLike } from "../shared/id";
import { safeJsonStringify } from "../shared/json";
import { nowIso } from "../shared/time";
import type { DeleteResult, MonitorRepository } from "../repositories/interfaces";
import type { SqliteDatabase } from "./client";
import { mapSqliteMonitor } from "./mappers";

interface MonitorRow {
  id: string;
  user_id: string;
  request_id: string;
  name: string;
  schedule_cron: string;
  enabled: number;
  config_json: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

const MONITOR_SELECT = `
  SELECT
    id,
    user_id,
    request_id,
    name,
    schedule_cron,
    enabled,
    config_json,
    last_run_at,
    next_run_at,
    created_at,
    updated_at
  FROM monitors
`;

const asIsoOrNull = (value: Date | string | undefined): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
};

export class SqliteMonitorRepository implements MonitorRepository {
  private readonly insertStmt: any;
  private readonly findByIdStmt: any;
  private readonly findByIdForUserStmt: any;
  private readonly listByUserStmt: any;
  private readonly listDueStmt: any;
  private readonly deleteByRequestStmt: any;

  constructor(private readonly db: SqliteDatabase) {
    this.insertStmt = this.db.prepare(
      `
        INSERT INTO monitors (
          id,
          user_id,
          request_id,
          name,
          schedule_cron,
          enabled,
          config_json,
          last_run_at,
          next_run_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    this.findByIdStmt = this.db.prepare(`${MONITOR_SELECT} WHERE id = ? LIMIT 1`);

    this.findByIdForUserStmt = this.db.prepare(
      `${MONITOR_SELECT} WHERE id = ? AND user_id = ? LIMIT 1`
    );

    this.listByUserStmt = this.db.prepare(
      `${MONITOR_SELECT}
       WHERE user_id = ?
       ORDER BY created_at DESC`
    );

    this.listDueStmt = this.db.prepare(
      `${MONITOR_SELECT}
       WHERE enabled = 1
         AND next_run_at IS NOT NULL
         AND next_run_at <= ?
       ORDER BY next_run_at ASC
       LIMIT ?`
    );

    this.deleteByRequestStmt = this.db.prepare(
      "DELETE FROM monitors WHERE user_id = ? AND request_id = ?"
    );
  }

  async create(input: CreateMonitorInput): Promise<MonitorEntity> {
    const id = generateObjectIdLike();
    const now = nowIso();

    this.insertStmt.run(
      id,
      input.user,
      input.request,
      input.name,
      input.scheduleCron,
      input.enabled === false ? 0 : 1,
      input.config ? safeJsonStringify(input.config, "{}") : null,
      null,
      asIsoOrNull(input.nextRunAt),
      now,
      now
    );

    const row = this.findByIdStmt.get(id) as MonitorRow | undefined;

    if (!row) {
      throw new Error("Failed to create monitor row");
    }

    return mapSqliteMonitor(row);
  }

  async listByUser(userId: string): Promise<MonitorEntity[]> {
    const rows = this.listByUserStmt.all(userId) as MonitorRow[];
    return rows.map((row) => mapSqliteMonitor(row));
  }

  async listDue(now: string, limit: number): Promise<MonitorEntity[]> {
    const rows = this.listDueStmt.all(now, limit) as MonitorRow[];
    return rows.map((row) => mapSqliteMonitor(row));
  }

  async update(input: UpdateMonitorInput): Promise<MonitorEntity | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (input.enabled !== undefined) {
      setClauses.push("enabled = ?");
      values.push(input.enabled ? 1 : 0);
    }

    if (input.scheduleCron !== undefined) {
      setClauses.push("schedule_cron = ?");
      values.push(input.scheduleCron);
    }

    if (input.config !== undefined) {
      setClauses.push("config_json = ?");
      values.push(safeJsonStringify(input.config, "{}"));
    }

    if (input.lastRunAt !== undefined) {
      setClauses.push("last_run_at = ?");
      values.push(asIsoOrNull(input.lastRunAt));
    }

    if (input.nextRunAt !== undefined) {
      setClauses.push("next_run_at = ?");
      values.push(asIsoOrNull(input.nextRunAt));
    }

    if (setClauses.length === 0) {
      const existing = this.findByIdForUserStmt.get(
        input.monitorId,
        input.user
      ) as MonitorRow | undefined;
      return existing ? mapSqliteMonitor(existing) : null;
    }

    setClauses.push("updated_at = ?");
    values.push(nowIso());

    const result = this.db
      .prepare(
        `
          UPDATE monitors
          SET ${setClauses.join(", ")}
          WHERE id = ? AND user_id = ?
        `
      )
      .run(...values, input.monitorId, input.user);

    if (!result.changes) {
      return null;
    }

    const updated = this.findByIdForUserStmt.get(
      input.monitorId,
      input.user
    ) as MonitorRow | undefined;

    return updated ? mapSqliteMonitor(updated) : null;
  }

  async deleteByRequest(userId: string, requestId: string): Promise<DeleteResult> {
    const result = this.deleteByRequestStmt.run(userId, requestId);
    return { deletedCount: result.changes || 0 };
  }
}
