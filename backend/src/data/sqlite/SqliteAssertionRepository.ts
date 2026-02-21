import type { AssertionEntity, CreateAssertionInput } from "../entities";
import { generateObjectIdLike } from "../shared/id";
import { safeJsonStringify } from "../shared/json";
import { nowIso } from "../shared/time";
import type {
  AssertionRepository,
  DeleteResult,
} from "../repositories/interfaces";
import type { SqliteDatabase } from "./client";
import { mapSqliteAssertion } from "./mappers";

interface AssertionRow {
  id: string;
  user_id: string;
  request_id: string;
  name: string;
  rule_json: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

const ASSERTION_SELECT = `
  SELECT
    id,
    user_id,
    request_id,
    name,
    rule_json,
    enabled,
    created_at,
    updated_at
  FROM assertions
`;

export class SqliteAssertionRepository implements AssertionRepository {
  private readonly insertStmt: any;
  private readonly findByIdStmt: any;
  private readonly listByRequestStmt: any;
  private readonly deleteByRequestStmt: any;

  constructor(private readonly db: SqliteDatabase) {
    this.insertStmt = this.db.prepare(
      `
        INSERT INTO assertions (
          id,
          user_id,
          request_id,
          name,
          rule_json,
          enabled,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    this.findByIdStmt = this.db.prepare(`${ASSERTION_SELECT} WHERE id = ? LIMIT 1`);

    this.listByRequestStmt = this.db.prepare(
      `${ASSERTION_SELECT}
       WHERE user_id = ? AND request_id = ?
       ORDER BY updated_at DESC`
    );

    this.deleteByRequestStmt = this.db.prepare(
      "DELETE FROM assertions WHERE user_id = ? AND request_id = ?"
    );
  }

  async create(input: CreateAssertionInput): Promise<AssertionEntity> {
    const id = generateObjectIdLike();
    const now = nowIso();

    this.insertStmt.run(
      id,
      input.user,
      input.request,
      input.name,
      safeJsonStringify(input.rule, "{}"),
      input.enabled === false ? 0 : 1,
      now,
      now
    );

    const row = this.findByIdStmt.get(id) as AssertionRow | undefined;

    if (!row) {
      throw new Error("Failed to create assertion row");
    }

    return mapSqliteAssertion(row);
  }

  async listByRequest(userId: string, requestId: string): Promise<AssertionEntity[]> {
    const rows = this.listByRequestStmt.all(userId, requestId) as AssertionRow[];
    return rows.map((row) => mapSqliteAssertion(row));
  }

  async deleteByRequest(userId: string, requestId: string): Promise<DeleteResult> {
    const result = this.deleteByRequestStmt.run(userId, requestId);
    return { deletedCount: result.changes || 0 };
  }
}
