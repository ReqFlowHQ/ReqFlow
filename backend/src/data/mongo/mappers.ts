import type {
  AssertionEntity,
  CollectionEntity,
  MonitorEntity,
  PrimitiveMap,
  RequestEntity,
  RunAssertionResultEntity,
  RunEntity,
  StoredResponse,
} from "../entities";

const toPlain = (doc: any): Record<string, any> => {
  if (!doc) return {};
  if (typeof doc.toObject === "function") {
    return doc.toObject();
  }
  return doc;
};

const asString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const asDate = (value: unknown): Date | string => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(String(value));
};

const asPrimitiveMap = (value: unknown, fallback: PrimitiveMap = {}): PrimitiveMap => {
  if (!value || typeof value !== "object") return fallback;
  return value as PrimitiveMap;
};

const asStoredResponse = (value: unknown): StoredResponse | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const typed = value as Record<string, unknown>;
  return {
    status: Number(typed.status || 0),
    statusText: String(typed.statusText || ""),
    data: typed.data,
    headers: asPrimitiveMap(typed.headers, {}),
  };
};

const asRunAssertionResults = (value: unknown): RunAssertionResultEntity[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const typed = item as Record<string, unknown>;
      return {
        assertionId: asString(typed.assertionId),
        name: asString(typed.name),
        passed: Boolean(typed.passed),
        message: typed.message ? asString(typed.message) : undefined,
      };
    });
};

export const mapMongoRequest = (doc: any): RequestEntity => {
  const row = toPlain(doc);
  return {
    _id: asString(row._id),
    user: asString(row.user),
    collection: row.collection ? asString(row.collection) : null,
    name: asString(row.name),
    method: asString(row.method),
    url: asString(row.url),
    params: asPrimitiveMap(row.params, {}),
    auth: (row.auth && typeof row.auth === "object" ? row.auth : { type: "none" }) as Record<string, unknown>,
    headers: asPrimitiveMap(row.headers, {}),
    body: row.body,
    response: asStoredResponse(row.response),
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
};

export const mapMongoCollection = (doc: any): CollectionEntity => {
  const row = toPlain(doc);
  return {
    _id: asString(row._id),
    user: asString(row.user),
    name: asString(row.name),
    description: row.description ? asString(row.description) : undefined,
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
};

export const mapMongoRun = (doc: any): RunEntity => {
  const row = toPlain(doc);
  return {
    _id: asString(row._id),
    user: asString(row.user),
    request: asString(row.request),
    status: Number(row.status || 0),
    statusText: asString(row.statusText),
    durationMs: Number(row.durationMs || 0),
    response: asStoredResponse(row.response),
    assertionResults: asRunAssertionResults(row.assertionResults),
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
};

export const mapMongoAssertion = (doc: any): AssertionEntity => {
  const row = toPlain(doc);
  return {
    _id: asString(row._id),
    user: asString(row.user),
    request: asString(row.request),
    name: asString(row.name),
    rule: (row.rule && typeof row.rule === "object" ? row.rule : {}) as Record<string, unknown>,
    enabled: Boolean(row.enabled),
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
};

export const mapMongoMonitor = (doc: any): MonitorEntity => {
  const row = toPlain(doc);
  return {
    _id: asString(row._id),
    user: asString(row.user),
    request: asString(row.request),
    name: asString(row.name),
    scheduleCron: asString(row.scheduleCron),
    enabled: Boolean(row.enabled),
    config: (row.config && typeof row.config === "object" ? row.config : undefined) as Record<string, unknown> | undefined,
    lastRunAt: row.lastRunAt ? asDate(row.lastRunAt) : undefined,
    nextRunAt: row.nextRunAt ? asDate(row.nextRunAt) : undefined,
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  };
};
