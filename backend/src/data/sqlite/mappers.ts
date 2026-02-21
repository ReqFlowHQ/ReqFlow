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
import { safeJsonParse } from "../shared/json";

interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface RequestRow {
  id: string;
  user_id: string;
  collection_id: string | null;
  name: string;
  method: string;
  url: string;
  params_json: string;
  auth_json: string;
  headers_json: string;
  body_json: string | null;
  response_json: string | null;
  created_at: string;
  updated_at: string;
}

interface RunRow {
  id: string;
  user_id: string;
  request_id: string;
  status: number;
  status_text: string;
  duration_ms: number;
  response_json: string | null;
  assertion_results_json: string | null;
  created_at: string;
  updated_at: string;
}

interface AssertionRow {
  id: string;
  user_id: string;
  request_id: string;
  name: string;
  rule_json: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

interface MonitorRow {
  id: string;
  user_id: string;
  request_id: string;
  name: string;
  schedule_cron: string;
  enabled: number;
  config_json: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

const parsePrimitiveMap = (json: string, fallback: PrimitiveMap = {}): PrimitiveMap =>
  safeJsonParse<PrimitiveMap>(json, fallback);

const parseStoredResponse = (json: string | null): StoredResponse | undefined => {
  if (!json) return undefined;
  const parsed = safeJsonParse<Record<string, unknown>>(json, {});
  return {
    status: Number(parsed.status || 0),
    statusText: String(parsed.statusText || ""),
    data: parsed.data,
    headers: (parsed.headers as PrimitiveMap) || {},
  };
};

const parseRunAssertionResults = (json: string | null): RunAssertionResultEntity[] => {
  if (!json) return [];
  return safeJsonParse<RunAssertionResultEntity[]>(json, []);
};

export const mapSqliteCollection = (row: CollectionRow): CollectionEntity => ({
  _id: row.id,
  user: row.user_id,
  name: row.name,
  description: row.description || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapSqliteRequest = (row: RequestRow): RequestEntity => ({
  _id: row.id,
  user: row.user_id,
  collection: row.collection_id,
  name: row.name,
  method: row.method,
  url: row.url,
  params: parsePrimitiveMap(row.params_json, {}),
  auth: safeJsonParse<Record<string, unknown>>(row.auth_json, { type: "none" }),
  headers: parsePrimitiveMap(row.headers_json, {}),
  body: row.body_json ? safeJsonParse<unknown>(row.body_json, undefined) : undefined,
  response: parseStoredResponse(row.response_json),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapSqliteRun = (row: RunRow): RunEntity => ({
  _id: row.id,
  user: row.user_id,
  request: row.request_id,
  status: Number(row.status),
  statusText: row.status_text,
  durationMs: Number(row.duration_ms),
  response: parseStoredResponse(row.response_json),
  assertionResults: parseRunAssertionResults(row.assertion_results_json),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapSqliteAssertion = (row: AssertionRow): AssertionEntity => ({
  _id: row.id,
  user: row.user_id,
  request: row.request_id,
  name: row.name,
  rule: safeJsonParse<Record<string, unknown>>(row.rule_json, {}),
  enabled: Boolean(row.enabled),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapSqliteMonitor = (row: MonitorRow): MonitorEntity => ({
  _id: row.id,
  user: row.user_id,
  request: row.request_id,
  name: row.name,
  scheduleCron: row.schedule_cron,
  enabled: Boolean(row.enabled),
  config: row.config_json
    ? safeJsonParse<Record<string, unknown>>(row.config_json, {})
    : undefined,
  lastRunAt: row.last_run_at || undefined,
  nextRunAt: row.next_run_at || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
