import type Database from "better-sqlite3";

interface SqliteMigration {
  version: number;
  name: string;
  sql: string;
}

const MIGRATIONS: SqliteMigration[] = [
  {
    version: 1,
    name: "create_base_tables",
    sql: `
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        collection_id TEXT,
        name TEXT NOT NULL,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        params_json TEXT NOT NULL,
        auth_json TEXT NOT NULL,
        headers_json TEXT NOT NULL,
        body_json TEXT,
        response_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        status INTEGER NOT NULL,
        status_text TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        response_json TEXT,
        assertion_results_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS assertions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        name TEXT NOT NULL,
        rule_json TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS monitors (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        name TEXT NOT NULL,
        schedule_cron TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        config_json TEXT,
        last_run_at TEXT,
        next_run_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE
      );
    `,
  },
  {
    version: 2,
    name: "create_performance_indexes",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_collections_user_created
        ON collections(user_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_requests_user_collection_updated
        ON requests(user_id, collection_id, updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_requests_user_updated
        ON requests(user_id, updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_runs_request_created
        ON runs(request_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_runs_user_created
        ON runs(user_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_assertions_request_enabled
        ON assertions(request_id, enabled, updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_monitors_user_due
        ON monitors(user_id, enabled, next_run_at);

      CREATE INDEX IF NOT EXISTS idx_monitors_request
        ON monitors(request_id);
    `,
  },
];

export const runSqliteMigrations = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedVersions = new Set<number>(
    (db.prepare("SELECT version FROM _migrations ORDER BY version ASC").all() as Array<{ version: number }>).map(
      (row) => row.version
    )
  );

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    const applyMigration = db.transaction(() => {
      db.exec(migration.sql);
      db.prepare(
        "INSERT INTO _migrations(version, name, applied_at) VALUES (?, ?, ?)"
      ).run(migration.version, migration.name, new Date().toISOString());
    });

    applyMigration();
  }
};
