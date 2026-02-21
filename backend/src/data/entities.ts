export type PrimitiveValue = string | number | boolean | null | undefined;
export type PrimitiveMap = Record<string, PrimitiveValue>;
export type JsonRecord = Record<string, unknown>;

export interface StoredResponse {
  status: number;
  statusText: string;
  data: unknown;
  headers: PrimitiveMap;
}

export interface RequestEntity {
  _id: string;
  user: string;
  collection?: string | null;
  name: string;
  method: string;
  url: string;
  params?: PrimitiveMap;
  auth?: JsonRecord;
  headers?: PrimitiveMap;
  body?: unknown;
  response?: StoredResponse;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CollectionEntity {
  _id: string;
  user: string;
  name: string;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RunAssertionResultEntity {
  assertionId: string;
  name: string;
  passed: boolean;
  message?: string;
}

export interface RunEntity {
  _id: string;
  user: string;
  request: string;
  status: number;
  statusText: string;
  durationMs: number;
  response?: StoredResponse;
  assertionResults?: RunAssertionResultEntity[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AssertionEntity {
  _id: string;
  user: string;
  request: string;
  name: string;
  rule: JsonRecord;
  enabled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MonitorEntity {
  _id: string;
  user: string;
  request: string;
  name: string;
  scheduleCron: string;
  enabled: boolean;
  config?: JsonRecord;
  lastRunAt?: Date | string;
  nextRunAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateRequestInput {
  user: string;
  collection?: string | null;
  name: string;
  method: string;
  url: string;
  params?: PrimitiveMap;
  auth?: JsonRecord;
  headers?: PrimitiveMap;
  body?: unknown;
}

export interface UpdateRequestInput {
  collection?: string | null;
  name?: string;
  method?: string;
  url?: string;
  params?: PrimitiveMap;
  auth?: JsonRecord;
  headers?: PrimitiveMap;
  body?: unknown;
  response?: StoredResponse;
}

export interface CreateCollectionInput {
  user: string;
  name: string;
  description?: string;
}

export interface CreateRunInput {
  user: string;
  request: string;
  status: number;
  statusText: string;
  durationMs: number;
  response?: StoredResponse;
  assertionResults?: RunAssertionResultEntity[];
}

export interface CreateAssertionInput {
  user: string;
  request: string;
  name: string;
  rule: JsonRecord;
  enabled?: boolean;
}

export interface CreateMonitorInput {
  user: string;
  request: string;
  name: string;
  scheduleCron: string;
  enabled?: boolean;
  config?: JsonRecord;
  nextRunAt?: Date | string;
}

export interface UpdateMonitorInput {
  monitorId: string;
  user: string;
  enabled?: boolean;
  scheduleCron?: string;
  config?: JsonRecord;
  lastRunAt?: Date | string;
  nextRunAt?: Date | string;
}
