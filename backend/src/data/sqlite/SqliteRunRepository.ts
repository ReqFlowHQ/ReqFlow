import type { CreateRunInput, RunEntity } from "../entities";
import { generateObjectIdLike } from "../shared/id";
import { safeJsonStringify } from "../shared/json";
import { nowIso } from "../shared/time";
import type { DeleteResult, RunRepository } from "../repositories/interfaces";
import type { SqliteDatabase } from "./client";
import { mapSqliteRun } from "./mappers";

interface RunRow {
  id: string;
  user_id: string;
  request_id: string;
  status: number;
  status_text: string;
  duration_ms: number;
  response_json: string | null;
  assertion_results_json: string | null;
  created_at: string;
  updated_at: string;
}

const RUN_SELECT = `
  SELECT
    id,
    user_id,
    request_id,
    status,
    status_text,
    duration_ms,
    response_json,
    assertion_results_json,
    created_at,
    updated_at
  FROM runs
`;

export class SqliteRunRepository implements RunRepository {
  private readonly insertStmt: any;
  private readonly findByIdStmt: any;
  private readonly listByRequestStmt: any;
  private readonly listByRequestBeforeStmt: any;
  private readonly deleteByRequestStmt: any;

  constructor(private readonly db: SqliteDatabase) {
    this.insertStmt = this.db.prepare(
      `
        INSERT INTO runs (
          id,
          user_id,
          request_id,
          status,
          status_text,
          duration_ms,
          response_json,
          assertion_results_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    this.findByIdStmt = this.db.prepare(
      `${RUN_SELECT} WHERE id = ? AND user_id = ? LIMIT 1`
    );

    this.listByRequestStmt = this.db.prepare(
      `${RUN_SELECT}
       WHERE user_id = ? AND request_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    );

    this.listByRequestBeforeStmt = this.db.prepare(
      `${RUN_SELECT}
       WHERE user_id = ? AND request_id = ? AND created_at < ?
       ORDER BY created_at DESC
       LIMIT ?`
    );

    this.deleteByRequestStmt = this.db.prepare(
      "DELETE FROM runs WHERE user_id = ? AND request_id = ?"
    );
  }

  async create(input: CreateRunInput): Promise<RunEntity> {
    const id = generateObjectIdLike();
    const now = nowIso();

    this.insertStmt.run(
      id,
      input.user,
      input.request,
      input.status,
      input.statusText,
      input.durationMs,
      input.response ? safeJsonStringify(input.response, "null") : null,
      input.assertionResults ? safeJsonStringify(input.assertionResults, "[]") : "[]",
      now,
      now
    );

    const row = this.findByIdStmt.get(id, input.user) as RunRow | undefined;
    if (!row) {
      throw new Error("Failed to create run row");
    }

    return mapSqliteRun(row);
  }

  async findByIdForUser(id: string, userId: string): Promise<RunEntity | null> {
    const row = this.findByIdStmt.get(id, userId) as RunRow | undefined;
    return row ? mapSqliteRun(row) : null;
  }

  async listByRequest(
    userId: string,
    requestId: string,
    query: { limit: number; before?: string }
  ): Promise<RunEntity[]> {
    const rows = query.before
      ? (this.listByRequestBeforeStmt.all(
          userId,
          requestId,
          query.before,
          query.limit
        ) as RunRow[])
      : (this.listByRequestStmt.all(userId, requestId, query.limit) as RunRow[]);
    return rows.map((row) => mapSqliteRun(row));
  }

  async deleteByRequest(userId: string, requestId: string): Promise<DeleteResult> {
    const result = this.deleteByRequestStmt.run(userId, requestId);
    return { deletedCount: result.changes || 0 };
  }
}
