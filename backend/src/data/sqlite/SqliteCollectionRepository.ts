import type { CollectionEntity, CreateCollectionInput } from "../entities";
import { generateObjectIdLike } from "../shared/id";
import { nowIso } from "../shared/time";
import type {
  CollectionRepository,
  DeleteResult,
} from "../repositories/interfaces";
import type { SqliteDatabase } from "./client";
import { mapSqliteCollection } from "./mappers";

interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const COLLECTION_SELECT =
  "SELECT id, user_id, name, description, created_at, updated_at FROM collections";

export class SqliteCollectionRepository implements CollectionRepository {
  private readonly insertStmt: any;
  private readonly findByIdStmt: any;
  private readonly listByUserStmt: any;
  private readonly deleteByIdForUserStmt: any;

  constructor(private readonly db: SqliteDatabase) {
    this.insertStmt = this.db.prepare(
      `
        INSERT INTO collections (
          id, user_id, name, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
    );

    this.findByIdStmt = this.db.prepare(
      `${COLLECTION_SELECT} WHERE id = ? LIMIT 1`
    );

    this.listByUserStmt = this.db.prepare(
      `
        ${COLLECTION_SELECT}
        WHERE user_id = ?
        ORDER BY created_at DESC
      `
    );

    this.deleteByIdForUserStmt = this.db.prepare(
      "DELETE FROM collections WHERE id = ? AND user_id = ?"
    );
  }

  async create(input: CreateCollectionInput): Promise<CollectionEntity> {
    const id = generateObjectIdLike();
    const now = nowIso();

    this.insertStmt.run(
      id,
      input.user,
      input.name,
      input.description ?? null,
      now,
      now
    );

    const row = this.findByIdStmt.get(id) as CollectionRow;
    return mapSqliteCollection(row);
  }

  async listByUser(userId: string): Promise<CollectionEntity[]> {
    const rows = this.listByUserStmt.all(userId) as CollectionRow[];
    return rows.map((row) => mapSqliteCollection(row));
  }

  async deleteByIdForUser(id: string, userId: string): Promise<DeleteResult> {
    const result = this.deleteByIdForUserStmt.run(id, userId);
    return { deletedCount: result.changes || 0 };
  }
}
