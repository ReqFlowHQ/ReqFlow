import type {
  AssertionEntity,
  CollectionEntity,
  CreateAssertionInput,
  CreateCollectionInput,
  CreateMonitorInput,
  CreateRequestInput,
  CreateRunInput,
  MonitorEntity,
  RequestEntity,
  RunEntity,
  StoredResponse,
  UpdateMonitorInput,
  UpdateRequestInput,
} from "../entities";

export type RepositoryDriver = "mongo" | "sqlite";

export interface DeleteResult {
  deletedCount: number;
}

export interface RequestRepository {
  create(input: CreateRequestInput): Promise<RequestEntity>;
  findByIdForUser(id: string, userId: string): Promise<RequestEntity | null>;
  listByCollection(userId: string, collectionId: string, limit: number): Promise<RequestEntity[]>;
  updateByIdForUser(id: string, userId: string, updates: UpdateRequestInput): Promise<RequestEntity | null>;
  saveResponse(id: string, userId: string, response: StoredResponse): Promise<RequestEntity | null>;
  deleteByIdForUser(id: string, userId: string): Promise<DeleteResult>;
  deleteByCollectionForUser(userId: string, collectionId: string): Promise<DeleteResult>;
}

export interface CollectionRepository {
  create(input: CreateCollectionInput): Promise<CollectionEntity>;
  listByUser(userId: string): Promise<CollectionEntity[]>;
  deleteByIdForUser(id: string, userId: string): Promise<DeleteResult>;
}

export interface RunRepository {
  create(input: CreateRunInput): Promise<RunEntity>;
  findByIdForUser(id: string, userId: string): Promise<RunEntity | null>;
  listByRequest(
    userId: string,
    requestId: string,
    query: { limit: number; before?: string }
  ): Promise<RunEntity[]>;
  deleteByRequest(userId: string, requestId: string): Promise<DeleteResult>;
}

export interface AssertionRepository {
  create(input: CreateAssertionInput): Promise<AssertionEntity>;
  listByRequest(userId: string, requestId: string): Promise<AssertionEntity[]>;
  deleteByRequest(userId: string, requestId: string): Promise<DeleteResult>;
}

export interface MonitorRepository {
  create(input: CreateMonitorInput): Promise<MonitorEntity>;
  listByUser(userId: string): Promise<MonitorEntity[]>;
  listDue(nowIso: string, limit: number): Promise<MonitorEntity[]>;
  update(input: UpdateMonitorInput): Promise<MonitorEntity | null>;
  deleteByRequest(userId: string, requestId: string): Promise<DeleteResult>;
}

export interface RepositoryRegistry {
  driver: RepositoryDriver;
  requests: RequestRepository;
  collections: CollectionRepository;
  runs: RunRepository;
  assertions: AssertionRepository;
  monitors: MonitorRepository;
}
