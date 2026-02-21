import type {
  CreateRequestInput,
  RequestEntity,
  StoredResponse,
  UpdateRequestInput,
} from "../entities";
import { generateObjectIdLike } from "../shared/id";
import { safeJsonStringify } from "../shared/json";
import { nowIso } from "../shared/time";
import type { DeleteResult, RequestRepository } from "../repositories/interfaces";
import type { SqliteDatabase } from "./client";
import { mapSqliteRequest } from "./mappers";

interface RequestRow {
  id: string;
  user_id: string;
  collection_id: string | null;
  name: string;
  method: string;
  url: string;
  params_json: string;
  auth_json: string;
  headers_json: string;
  body_json: string | null;
  response_json: string | null;
  created_at: string;
  updated_at: string;
}

const REQUEST_SELECT = `
  SELECT
    id,
    user_id,
    collection_id,
    name,
    method,
    url,
    params_json,
    auth_json,
    headers_json,
    body_json,
    response_json,
    created_at,
    updated_at
  FROM requests
`;

export class SqliteRequestRepository implements RequestRepository {
  private readonly insertStmt: any;
  private readonly findByIdForUserStmt: any;
  private readonly listByCollectionStmt: any;
  private readonly saveResponseStmt: any;
  private readonly deleteByIdForUserStmt: any;
  private readonly deleteByCollectionForUserStmt: any;

  constructor(private readonly db: SqliteDatabase) {
    this.insertStmt = this.db.prepare(
      `
        INSERT INTO requests (
          id,
          user_id,
          collection_id,
          name,
          method,
          url,
          params_json,
          auth_json,
          headers_json,
          body_json,
          response_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    this.findByIdForUserStmt = this.db.prepare(
      `${REQUEST_SELECT} WHERE id = ? AND user_id = ? LIMIT 1`
    );

    this.listByCollectionStmt = this.db.prepare(
      `${REQUEST_SELECT}
       WHERE user_id = ? AND collection_id = ?
       ORDER BY updated_at DESC
       LIMIT ?`
    );

    this.saveResponseStmt = this.db.prepare(
      `
        UPDATE requests
        SET response_json = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `
    );

    this.deleteByIdForUserStmt = this.db.prepare(
      "DELETE FROM requests WHERE id = ? AND user_id = ?"
    );

    this.deleteByCollectionForUserStmt = this.db.prepare(
      "DELETE FROM requests WHERE user_id = ? AND collection_id = ?"
    );
  }

  async create(input: CreateRequestInput): Promise<RequestEntity> {
    const id = generateObjectIdLike();
    const now = nowIso();

    this.insertStmt.run(
      id,
      input.user,
      input.collection ?? null,
      input.name,
      input.method,
      input.url,
      safeJsonStringify(input.params || {}, "{}"),
      safeJsonStringify(input.auth || { type: "none" }, '{"type":"none"}'),
      safeJsonStringify(input.headers || {}, "{}"),
      input.body === undefined ? null : safeJsonStringify(input.body, "null"),
      null,
      now,
      now
    );

    const row = this.findByIdForUserStmt.get(id, input.user) as RequestRow | undefined;

    if (!row) {
      throw new Error("Failed to create request row");
    }

    return mapSqliteRequest(row);
  }

  async findByIdForUser(id: string, userId: string): Promise<RequestEntity | null> {
    const row = this.findByIdForUserStmt.get(id, userId) as RequestRow | undefined;
    return row ? mapSqliteRequest(row) : null;
  }

  async listByCollection(userId: string, collectionId: string, limit: number): Promise<RequestEntity[]> {
    const rows = this.listByCollectionStmt.all(userId, collectionId, limit) as RequestRow[];
    return rows.map((row) => mapSqliteRequest(row));
  }

  async updateByIdForUser(
    id: string,
    userId: string,
    updates: UpdateRequestInput
  ): Promise<RequestEntity | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.collection !== undefined) {
      setClauses.push("collection_id = ?");
      values.push(updates.collection ?? null);
    }
    if (updates.name !== undefined) {
      setClauses.push("name = ?");
      values.push(updates.name);
    }
    if (updates.method !== undefined) {
      setClauses.push("method = ?");
      values.push(updates.method);
    }
    if (updates.url !== undefined) {
      setClauses.push("url = ?");
      values.push(updates.url);
    }
    if (updates.params !== undefined) {
      setClauses.push("params_json = ?");
      values.push(safeJsonStringify(updates.params || {}, "{}"));
    }
    if (updates.auth !== undefined) {
      setClauses.push("auth_json = ?");
      values.push(
        safeJsonStringify(updates.auth || { type: "none" }, '{"type":"none"}')
      );
    }
    if (updates.headers !== undefined) {
      setClauses.push("headers_json = ?");
      values.push(safeJsonStringify(updates.headers || {}, "{}"));
    }
    if (Object.prototype.hasOwnProperty.call(updates, "body") && updates.body !== undefined) {
      setClauses.push("body_json = ?");
      values.push(safeJsonStringify(updates.body, "null"));
    }
    if (
      Object.prototype.hasOwnProperty.call(updates, "response") &&
      updates.response !== undefined
    ) {
      setClauses.push("response_json = ?");
      values.push(safeJsonStringify(updates.response, "null"));
    }

    if (setClauses.length === 0) {
      return this.findByIdForUser(id, userId);
    }

    setClauses.push("updated_at = ?");
    values.push(nowIso());

    const result = this.db
      .prepare(
        `
          UPDATE requests
          SET ${setClauses.join(", ")}
          WHERE id = ? AND user_id = ?
        `
      )
      .run(...values, id, userId);

    if (!result.changes) {
      return null;
    }

    return this.findByIdForUser(id, userId);
  }

  async saveResponse(
    id: string,
    userId: string,
    response: StoredResponse
  ): Promise<RequestEntity | null> {
    const result = this.saveResponseStmt.run(
      safeJsonStringify(response, "null"),
      nowIso(),
      id,
      userId
    );

    if (!result.changes) {
      return null;
    }

    return this.findByIdForUser(id, userId);
  }

  async deleteByIdForUser(id: string, userId: string): Promise<DeleteResult> {
    const result = this.deleteByIdForUserStmt.run(id, userId);
    return { deletedCount: result.changes || 0 };
  }

  async deleteByCollectionForUser(userId: string, collectionId: string): Promise<DeleteResult> {
    const result = this.deleteByCollectionForUserStmt.run(userId, collectionId);
    return { deletedCount: result.changes || 0 };
  }
}
