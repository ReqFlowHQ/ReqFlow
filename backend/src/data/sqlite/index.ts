import type { RepositoryRegistry } from "../repositories/interfaces";
import type { SqliteDatabase } from "./client";
import { getSqliteClient } from "./client";
import { SqliteAssertionRepository } from "./SqliteAssertionRepository";
import { SqliteCollectionRepository } from "./SqliteCollectionRepository";
import { SqliteMonitorRepository } from "./SqliteMonitorRepository";
import { SqliteRequestRepository } from "./SqliteRequestRepository";
import { SqliteRunRepository } from "./SqliteRunRepository";

export const createSqliteRepositoryRegistry = (
  client?: SqliteDatabase
): RepositoryRegistry => {
  const db = client || getSqliteClient();
  return {
    driver: "sqlite",
    requests: new SqliteRequestRepository(db),
    collections: new SqliteCollectionRepository(db),
    runs: new SqliteRunRepository(db),
    assertions: new SqliteAssertionRepository(db),
    monitors: new SqliteMonitorRepository(db),
  };
};
