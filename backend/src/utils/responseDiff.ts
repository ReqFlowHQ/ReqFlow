import type { RunEntity, StoredResponse } from "../data/entities";

type JsonChangeType = "added" | "removed" | "changed";
type LineChangeType = "context" | "added" | "removed";

interface RunMeta {
  runId: string;
  requestId: string;
  status: number;
  statusText: string;
  createdAt: string;
}

export interface ResponseJsonDiffEntry {
  path: string;
  type: JsonChangeType;
  before?: unknown;
  after?: unknown;
}

export interface ResponseLineDiffEntry {
  type: LineChangeType;
  line: string;
  baseLineNumber: number | null;
  compareLineNumber: number | null;
}

export interface ResponseDiffSummary {
  hasDifferences: boolean;
  changed: number;
  added: number;
  removed: number;
  truncated: boolean;
}

export interface RunResponseDiffResult {
  mode: "json" | "text";
  baseRun: RunMeta;
  compareRun: RunMeta;
  summary: ResponseDiffSummary;
  json?: {
    entries: ResponseJsonDiffEntry[];
  };
  text?: {
    lines: ResponseLineDiffEntry[];
  };
}

interface JsonDiffAccumulator {
  changed: number;
  added: number;
  removed: number;
  truncated: boolean;
  entries: ResponseJsonDiffEntry[];
}

const MAX_JSON_DIFF_ENTRIES = 2000;
const MAX_TEXT_LINES_PER_SIDE = 800;
const MAX_TEXT_CHARS = 20000;

const toRunMeta = (run: RunEntity): RunMeta => ({
  runId: run._id,
  requestId: String(run.request),
  status: run.status,
  statusText: run.statusText,
  createdAt:
    run.createdAt instanceof Date
      ? run.createdAt.toISOString()
      : String(run.createdAt),
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const safeJsonStringify = (value: unknown, spacing = 0): string => {
  try {
    const serialized = JSON.stringify(value, null, spacing);
    return typeof serialized === "string" ? serialized : "";
  } catch {
    return String(value ?? "");
  }
};

const normalizeNewlines = (value: string): string => value.replace(/\r\n/g, "\n");

const getHeaderValue = (
  headers: Record<string, unknown> | undefined,
  key: string
): string => {
  if (!headers) return "";
  const target = key.toLowerCase();
  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (headerName.toLowerCase() === target) {
      return String(headerValue || "");
    }
  }
  return "";
};

const hasJsonContentType = (contentType: string): boolean => {
  const normalized = contentType.toLowerCase();
  return normalized.includes("application/json") || normalized.includes("+json");
};

const isTextWrapper = (
  data: Record<string, unknown>,
  contentType: string
): boolean => {
  if (hasJsonContentType(contentType)) {
    return false;
  }
  const keys = Object.keys(data);
  if (keys.length !== 1) {
    return false;
  }
  const key = keys[0];
  return (
    (key === "text" || key === "html") &&
    typeof data[key] === "string"
  );
};

const looksLikeStructuredJsonString = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
};

const tryParseJson = (value: string): unknown | undefined => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const toJsonComparableBody = (response?: StoredResponse): unknown | undefined => {
  const contentType = getHeaderValue(
    response?.headers as Record<string, unknown> | undefined,
    "content-type"
  );
  const data = response?.data;

  if (data === null || Array.isArray(data)) {
    return data;
  }

  if (isPlainObject(data)) {
    if (isTextWrapper(data, contentType)) {
      return undefined;
    }
    return data;
  }

  if (typeof data === "string") {
    const shouldParse =
      hasJsonContentType(contentType) || looksLikeStructuredJsonString(data);
    if (!shouldParse) {
      return undefined;
    }
    return tryParseJson(data);
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return hasJsonContentType(contentType) ? data : undefined;
  }

  if (data === undefined) {
    return null;
  }

  return undefined;
};

const toTextBody = (response?: StoredResponse): string => {
  const contentType = getHeaderValue(
    response?.headers as Record<string, unknown> | undefined,
    "content-type"
  );
  const data = response?.data;

  if (typeof data === "string") {
    return normalizeNewlines(data);
  }

  if (isPlainObject(data) && isTextWrapper(data, contentType)) {
    const textValue = (data.text ?? data.html) as string;
    return normalizeNewlines(textValue);
  }

  return normalizeNewlines(safeJsonStringify(data, 2));
};

const isNumberNaN = (value: unknown): boolean =>
  typeof value === "number" && Number.isNaN(value);

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (isNumberNaN(left) && isNumberNaN(right)) return true;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (!deepEqual(left[i], right[i])) return false;
    }
    return true;
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;

    for (const key of leftKeys) {
      if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
      if (!deepEqual(left[key], right[key])) return false;
    }
    return true;
  }

  return false;
};

const objectPathPart = (key: string): string => {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return `.${key}`;
  }
  return `[${JSON.stringify(key)}]`;
};

const pushJsonEntry = (
  acc: JsonDiffAccumulator,
  entry: ResponseJsonDiffEntry
): boolean => {
  if (acc.entries.length >= MAX_JSON_DIFF_ENTRIES) {
    acc.truncated = true;
    return false;
  }
  acc.entries.push(entry);
  return true;
};

const diffJsonValues = (
  baseValue: unknown,
  compareValue: unknown,
  path: string,
  acc: JsonDiffAccumulator
): void => {
  if (deepEqual(baseValue, compareValue)) {
    return;
  }

  if (baseValue === undefined) {
    acc.added += 1;
    pushJsonEntry(acc, {
      path,
      type: "added",
      after: compareValue,
    });
    return;
  }

  if (compareValue === undefined) {
    acc.removed += 1;
    pushJsonEntry(acc, {
      path,
      type: "removed",
      before: baseValue,
    });
    return;
  }

  if (Array.isArray(baseValue) && Array.isArray(compareValue)) {
    const maxLength = Math.max(baseValue.length, compareValue.length);
    for (let index = 0; index < maxLength; index += 1) {
      const nextPath = `${path}[${index}]`;
      const hasBase = index < baseValue.length;
      const hasCompare = index < compareValue.length;
      diffJsonValues(
        hasBase ? baseValue[index] : undefined,
        hasCompare ? compareValue[index] : undefined,
        nextPath,
        acc
      );
      if (acc.truncated) return;
    }
    return;
  }

  if (isPlainObject(baseValue) && isPlainObject(compareValue)) {
    const keys = new Set<string>([
      ...Object.keys(baseValue),
      ...Object.keys(compareValue),
    ]);
    for (const key of Array.from(keys).sort()) {
      const nextPath = `${path}${objectPathPart(key)}`;
      diffJsonValues(baseValue[key], compareValue[key], nextPath, acc);
      if (acc.truncated) return;
    }
    return;
  }

  acc.changed += 1;
  pushJsonEntry(acc, {
    path,
    type: "changed",
    before: baseValue,
    after: compareValue,
  });
};

const buildJsonDiff = (
  baseBody: unknown,
  compareBody: unknown
): {
  entries: ResponseJsonDiffEntry[];
  summary: ResponseDiffSummary;
} => {
  const acc: JsonDiffAccumulator = {
    changed: 0,
    added: 0,
    removed: 0,
    truncated: false,
    entries: [],
  };

  diffJsonValues(baseBody, compareBody, "$", acc);

  return {
    entries: acc.entries,
    summary: {
      hasDifferences: acc.entries.length > 0,
      changed: acc.changed,
      added: acc.added,
      removed: acc.removed,
      truncated: acc.truncated,
    },
  };
};

const splitLines = (value: string): string[] => {
  if (!value) {
    return [];
  }
  return value.split("\n");
};

const truncateText = (value: string): { text: string; truncated: boolean } => {
  if (value.length <= MAX_TEXT_CHARS) {
    return { text: value, truncated: false };
  }
  return {
    text: value.slice(0, MAX_TEXT_CHARS),
    truncated: true,
  };
};

const truncateLines = (
  lines: string[]
): { lines: string[]; truncated: boolean } => {
  if (lines.length <= MAX_TEXT_LINES_PER_SIDE) {
    return { lines, truncated: false };
  }
  return {
    lines: lines.slice(0, MAX_TEXT_LINES_PER_SIDE),
    truncated: true,
  };
};

const buildLcsMatrix = (baseLines: string[], compareLines: string[]): number[][] => {
  const matrix = Array.from({ length: baseLines.length + 1 }, () =>
    Array<number>(compareLines.length + 1).fill(0)
  );

  for (let i = baseLines.length - 1; i >= 0; i -= 1) {
    for (let j = compareLines.length - 1; j >= 0; j -= 1) {
      matrix[i][j] =
        baseLines[i] === compareLines[j]
          ? 1 + matrix[i + 1][j + 1]
          : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
    }
  }

  return matrix;
};

const buildLineDiff = (
  baseText: string,
  compareText: string
): {
  lines: ResponseLineDiffEntry[];
  summary: ResponseDiffSummary;
} => {
  const baseTextLimited = truncateText(baseText);
  const compareTextLimited = truncateText(compareText);
  const baseLinesLimited = truncateLines(splitLines(baseTextLimited.text));
  const compareLinesLimited = truncateLines(splitLines(compareTextLimited.text));
  const matrix = buildLcsMatrix(baseLinesLimited.lines, compareLinesLimited.lines);

  const lines: ResponseLineDiffEntry[] = [];
  let added = 0;
  let removed = 0;
  let baseIndex = 0;
  let compareIndex = 0;
  let baseLineNumber = 1;
  let compareLineNumber = 1;

  while (
    baseIndex < baseLinesLimited.lines.length &&
    compareIndex < compareLinesLimited.lines.length
  ) {
    if (baseLinesLimited.lines[baseIndex] === compareLinesLimited.lines[compareIndex]) {
      lines.push({
        type: "context",
        line: baseLinesLimited.lines[baseIndex],
        baseLineNumber,
        compareLineNumber,
      });
      baseIndex += 1;
      compareIndex += 1;
      baseLineNumber += 1;
      compareLineNumber += 1;
      continue;
    }

    if (matrix[baseIndex + 1][compareIndex] >= matrix[baseIndex][compareIndex + 1]) {
      lines.push({
        type: "removed",
        line: baseLinesLimited.lines[baseIndex],
        baseLineNumber,
        compareLineNumber: null,
      });
      removed += 1;
      baseIndex += 1;
      baseLineNumber += 1;
      continue;
    }

    lines.push({
      type: "added",
      line: compareLinesLimited.lines[compareIndex],
      baseLineNumber: null,
      compareLineNumber,
    });
    added += 1;
    compareIndex += 1;
    compareLineNumber += 1;
  }

  while (baseIndex < baseLinesLimited.lines.length) {
    lines.push({
      type: "removed",
      line: baseLinesLimited.lines[baseIndex],
      baseLineNumber,
      compareLineNumber: null,
    });
    removed += 1;
    baseIndex += 1;
    baseLineNumber += 1;
  }

  while (compareIndex < compareLinesLimited.lines.length) {
    lines.push({
      type: "added",
      line: compareLinesLimited.lines[compareIndex],
      baseLineNumber: null,
      compareLineNumber,
    });
    added += 1;
    compareIndex += 1;
    compareLineNumber += 1;
  }

  const truncated =
    baseTextLimited.truncated ||
    compareTextLimited.truncated ||
    baseLinesLimited.truncated ||
    compareLinesLimited.truncated;

  return {
    lines,
    summary: {
      hasDifferences: added > 0 || removed > 0,
      changed: 0,
      added,
      removed,
      truncated,
    },
  };
};

export const buildRunResponseDiff = (
  baseRun: RunEntity,
  compareRun: RunEntity
): RunResponseDiffResult => {
  const baseJsonBody = toJsonComparableBody(baseRun.response);
  const compareJsonBody = toJsonComparableBody(compareRun.response);
  const baseMeta = toRunMeta(baseRun);
  const compareMeta = toRunMeta(compareRun);

  if (baseJsonBody !== undefined && compareJsonBody !== undefined) {
    const jsonDiff = buildJsonDiff(baseJsonBody, compareJsonBody);
    return {
      mode: "json",
      baseRun: baseMeta,
      compareRun: compareMeta,
      summary: jsonDiff.summary,
      json: {
        entries: jsonDiff.entries,
      },
    };
  }

  const lineDiff = buildLineDiff(
    toTextBody(baseRun.response),
    toTextBody(compareRun.response)
  );
  return {
    mode: "text",
    baseRun: baseMeta,
    compareRun: compareMeta,
    summary: lineDiff.summary,
    text: {
      lines: lineDiff.lines,
    },
  };
};
