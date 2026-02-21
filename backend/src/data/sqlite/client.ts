import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { runSqliteMigrations } from "./migrations";

export type SqliteDatabase = Database.Database;

let sqliteClient: SqliteDatabase | null = null;

const resolveSqlitePath = (): string => {
  if (process.env.SQLITE_DB_PATH) {
    return path.resolve(process.env.SQLITE_DB_PATH);
  }
  return path.resolve(process.cwd(), "data", "reqflow.sqlite");
};

export const createSqliteClient = (): SqliteDatabase => {
  const filePath = resolveSqlitePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  runSqliteMigrations(db);
  return db;
};

export const getSqliteClient = (): SqliteDatabase => {
  if (!sqliteClient) {
    sqliteClient = createSqliteClient();
  }
  return sqliteClient;
};
