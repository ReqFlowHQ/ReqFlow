// FILE: frontend/src/components/HeaderEditor.tsx
import React, { useState, useEffect } from "react";

interface HeaderRow {
  id: string;
  key: string;
  value: string;
}

interface HeaderEditorProps {
  headers: Record<string, string>;
  requestId: string;
  updateRequest: (id: string, updates: Partial<any>) => void;
}

const rowsAreEqual = (a: HeaderRow[], b: HeaderRow[]) =>
  a.length === b.length &&
  a.every(
    (row, index) =>
      row.id === b[index]?.id &&
      row.key === b[index]?.key &&
      row.value === b[index]?.value
  );

const buildRowsFromHeaders = (
  source: Record<string, string>,
  previousRows: HeaderRow[] = []
): HeaderRow[] => {
  const idByKey = new Map(previousRows.map((row) => [row.key, row.id]));
  return Object.entries(source || {}).map(([key, value]) => ({
    id: idByKey.get(key) ?? crypto.randomUUID(),
    key,
    value,
  }));
};

export default function HeaderEditor({
  headers,
  requestId,
  updateRequest,
}: HeaderEditorProps) {
  const [rows, setRows] = useState<HeaderRow[]>([]);
  const isLocalSyncRef = React.useRef(false);

  useEffect(() => {
    isLocalSyncRef.current = false;
    setRows(buildRowsFromHeaders(headers || {}));
  }, [requestId]);

  useEffect(() => {
    if (isLocalSyncRef.current) {
      isLocalSyncRef.current = false;
      return;
    }

    setRows((previousRows) => {
      const nextRows = buildRowsFromHeaders(headers || {}, previousRows);
      return rowsAreEqual(previousRows, nextRows) ? previousRows : nextRows;
    });
  }, [headers]);

  const syncToRequest = (updatedRows: HeaderRow[]) => {
    const obj: Record<string, string> = {};
    updatedRows.forEach(({ key, value }) => {
      if (key.trim()) obj[key] = value;
    });
    isLocalSyncRef.current = true;
    updateRequest(requestId, { headers: obj });
  };

  const updateRow = (id: string, field: "key" | "value", value: string) => {
    setRows((previousRows) => {
      const updated = previousRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      );
      syncToRequest(updated);
      return updated;
    });
  };

  const addHeader = () => {
    const updated = [
      ...rows,
      { id: crypto.randomUUID(), key: "", value: "" },
    ];
    setRows(updated);
  };

  const removeHeader = (id: string) => {
    setRows((previousRows) => {
      const updated = previousRows.filter((row) => row.id !== id);
      syncToRequest(updated);
      return updated;
    });
  };

  return (
    <div className="mt-3 p-4 bg-white/55 dark:bg-slate-900/55 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/70 rounded-xl shadow-sm">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-col md:flex-row gap-2 mb-2">
          <input
            value={row.key}
            onChange={(e) => updateRow(row.id, "key", e.target.value)}
            placeholder="Header name"
            className="w-full md:w-1/3 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/85 dark:bg-slate-800/65 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          />
          <input
            value={row.value}
            onChange={(e) => updateRow(row.id, "value", e.target.value)}
            placeholder="Header value"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/85 dark:bg-slate-800/65 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          />
          <button
            onClick={() => removeHeader(row.id)}
            className="px-3 py-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addHeader}
        className="mt-2 px-3 py-1.5 text-sm text-cyan-700 dark:text-cyan-300 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition"
      >
        + Add Header
      </button>
    </div>
  );
}
