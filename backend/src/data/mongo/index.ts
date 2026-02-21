import { MongoAssertionRepository } from "./MongoAssertionRepository";
import { MongoCollectionRepository } from "./MongoCollectionRepository";
import { MongoMonitorRepository } from "./MongoMonitorRepository";
import { MongoRequestRepository } from "./MongoRequestRepository";
import { MongoRunRepository } from "./MongoRunRepository";
import type { RepositoryRegistry } from "../repositories/interfaces";

export const createMongoRepositoryRegistry = (): RepositoryRegistry => ({
  driver: "mongo",
  requests: new MongoRequestRepository(),
  collections: new MongoCollectionRepository(),
  runs: new MongoRunRepository(),
  assertions: new MongoAssertionRepository(),
  monitors: new MongoMonitorRepository(),
});
