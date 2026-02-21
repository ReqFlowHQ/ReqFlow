import React, { useEffect, useState } from "react";

interface ParamRow {
  id: string;
  key: string;
  value: string;
}

interface QueryParamsEditorProps {
  params: Record<string, string>;
  requestId: string;
  updateRequest: (id: string, updates: Partial<any>) => void;
}

const rowsAreEqual = (a: ParamRow[], b: ParamRow[]) =>
  a.length === b.length &&
  a.every(
    (row, index) =>
      row.id === b[index]?.id &&
      row.key === b[index]?.key &&
      row.value === b[index]?.value
  );

const buildRowsFromParams = (
  source: Record<string, string>,
  previousRows: ParamRow[] = []
): ParamRow[] => {
  const idByKey = new Map(previousRows.map((row) => [row.key, row.id]));
  return Object.entries(source || {}).map(([key, value]) => ({
    id: idByKey.get(key) ?? crypto.randomUUID(),
    key,
    value,
  }));
};

export default function QueryParamsEditor({
  params,
  requestId,
  updateRequest,
}: QueryParamsEditorProps) {
  const [rows, setRows] = useState<ParamRow[]>([]);
  const isLocalSyncRef = React.useRef(false);

  useEffect(() => {
    isLocalSyncRef.current = false;
    setRows(buildRowsFromParams(params || {}));
  }, [requestId]);

  useEffect(() => {
    if (isLocalSyncRef.current) {
      isLocalSyncRef.current = false;
      return;
    }

    setRows((previousRows) => {
      const nextRows = buildRowsFromParams(params || {}, previousRows);
      return rowsAreEqual(previousRows, nextRows) ? previousRows : nextRows;
    });
  }, [params]);

  const syncToRequest = (nextRows: ParamRow[]) => {
    const nextParams: Record<string, string> = {};
    for (const row of nextRows) {
      const key = row.key.trim();
      if (!key) continue;
      nextParams[key] = row.value;
    }
    isLocalSyncRef.current = true;
    updateRequest(requestId, { params: nextParams });
  };

  const updateRow = (id: string, field: "key" | "value", value: string) => {
    setRows((previousRows) => {
      const nextRows = previousRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      );
      syncToRequest(nextRows);
      return nextRows;
    });
  };

  const addParam = () => {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), key: "", value: "" }]);
  };

  const removeParam = (id: string) => {
    setRows((previousRows) => {
      const nextRows = previousRows.filter((row) => row.id !== id);
      syncToRequest(nextRows);
      return nextRows;
    });
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/55 p-4 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/55">
      {rows.map((row) => (
        <div key={row.id} className="mb-2 flex flex-col gap-2 md:flex-row">
          <input
            value={row.key}
            onChange={(event) => updateRow(row.id, "key", event.target.value)}
            placeholder="Param key"
            className="w-full rounded-lg border border-slate-300 bg-white/85 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/65 dark:text-slate-100 md:w-1/3"
          />
          <input
            value={row.value}
            onChange={(event) => updateRow(row.id, "value", event.target.value)}
            placeholder="Param value"
            className="flex-1 rounded-lg border border-slate-300 bg-white/85 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/65 dark:text-slate-100"
          />
          <button
            onClick={() => removeParam(row.id)}
            className="rounded-lg bg-rose-500 px-3 py-1.5 text-white transition hover:bg-rose-600"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        onClick={addParam}
        className="mt-2 rounded-lg px-3 py-1.5 text-sm text-cyan-700 transition hover:bg-slate-200/70 dark:text-cyan-300 dark:hover:bg-slate-700/70"
      >
        + Add Param
      </button>
    </div>
  );
}
