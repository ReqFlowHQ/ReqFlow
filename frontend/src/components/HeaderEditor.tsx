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

export default function HeaderEditor({
  headers,
  requestId,
  updateRequest,
}: HeaderEditorProps) {
  const [rows, setRows] = useState<HeaderRow[]>([]);

  useEffect(() => {
    const initialRows = Object.entries(headers || {}).map(
      ([key, value], i) => ({
        id: `${key}-${i}`,
        key,
        value,
      })
    );
    setRows(initialRows);
  }, [headers]);

  const syncToRequest = (updatedRows: HeaderRow[]) => {
    const obj: Record<string, string> = {};
    updatedRows.forEach(({ key, value }) => {
      if (key.trim()) obj[key] = value;
    });
    updateRequest(requestId, { headers: obj });
  };

  const updateRow = (id: string, field: "key" | "value", value: string) => {
    const updated = rows.map((r) =>
      r.id === id ? { ...r, [field]: value } : r
    );
    setRows(updated);
    syncToRequest(updated);
  };

  const addHeader = () => {
    const updated = [
      ...rows,
      { id: crypto.randomUUID(), key: "", value: "" },
    ];
    setRows(updated);
  };

  const removeHeader = (id: string) => {
    const updated = rows.filter((r) => r.id !== id);
    setRows(updated);
    syncToRequest(updated);
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
