import { createMongoRepositoryRegistry } from "../mongo";
import { createSqliteRepositoryRegistry } from "../sqlite";
import type { RepositoryDriver, RepositoryRegistry } from "./interfaces";

const isDriver = (value: string): value is RepositoryDriver =>
  value === "mongo" || value === "sqlite";

export const resolveRepositoryDriver = (): RepositoryDriver => {
  const raw = (process.env.DATA_REPOSITORY || process.env.REPOSITORY_DRIVER || "mongo")
    .trim()
    .toLowerCase();

  if (isDriver(raw)) {
    return raw;
  }

  return "mongo";
};

export const createRepositoryRegistry = (
  driver: RepositoryDriver = resolveRepositoryDriver()
): RepositoryRegistry => {
  if (driver === "sqlite") {
    return createSqliteRepositoryRegistry();
  }

  return createMongoRepositoryRegistry();
};
