import connectDB from "../config/db";
import {
  createRepositoryRegistry,
  resolveRepositoryDriver,
} from "./repositories/factory";
import type { RepositoryRegistry } from "./repositories/interfaces";
import { setRepositoryRegistry } from "./repositories/registry";

const isTruthy = (value: string | undefined): boolean =>
  ["1", "true", "yes", "on"].includes((value || "").trim().toLowerCase());

const shouldConnectMongoForAuth = (): boolean => {
  if (process.env.CONNECT_MONGO_FOR_AUTH !== undefined) {
    return isTruthy(process.env.CONNECT_MONGO_FOR_AUTH);
  }
  return Boolean(process.env.MONGO_URI || process.env.MONGODB_URI);
};

export const initializeDataLayer = async (): Promise<RepositoryRegistry> => {
  const driver = resolveRepositoryDriver();

  if (driver === "mongo") {
    await connectDB({ required: true });
  } else if (shouldConnectMongoForAuth()) {
    await connectDB({ required: false });
  }

  const registry = createRepositoryRegistry(driver);
  setRepositoryRegistry(registry);

  console.log(`✅ Repository driver initialized: ${registry.driver}`);
  return registry;
};
