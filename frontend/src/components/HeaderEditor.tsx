// FILE: frontend/src/components/HeaderEditor.tsx
import React, { useState, useEffect } from "react";

interface HeaderEditorProps {
  headers: Record<string, string>;
  requestId: string;
  updateRequest: (id: string, updates: Partial<any>) => void;
}

export default function HeaderEditor({ headers, requestId, updateRequest }: HeaderEditorProps) {
  const [localHeaders, setLocalHeaders] = useState<Record<string, string>>(headers || {});

  useEffect(() => {
    setLocalHeaders(headers || {});
  }, [headers]);

  const handleChange = (key: string, value: string) => {
    const updated = { ...localHeaders, [key]: value };
    setLocalHeaders(updated);
    updateRequest(requestId, { headers: updated });
  };

  const handleAddHeader = () => {
    let newKey = "New-Header";
    let counter = 1;
    while (newKey in localHeaders) newKey = `New-Header-${counter++}`;
    const updated = { ...localHeaders, [newKey]: "" };
    setLocalHeaders(updated);
    updateRequest(requestId, { headers: updated });
  };

  const handleRemoveHeader = (key: string) => {
    const updated = { ...localHeaders };
    delete updated[key];
    setLocalHeaders(updated);
    updateRequest(requestId, { headers: updated });
  };

  return (
    <div className="mt-3 p-4 bg-white/20 dark:bg-gray-900/30 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      {Object.entries(localHeaders).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 mb-2">
          <input
            value={key}
            onChange={(e) => {
              const newKey = e.target.value;
              const updated = { ...localHeaders };
              delete updated[key];
              updated[newKey] = value;
              setLocalHeaders(updated);
              updateRequest(requestId, { headers: updated });
            }}
            className="w-1/3 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/40 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/40 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <button
            onClick={() => handleRemoveHeader(key)}
            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={handleAddHeader}
        className="mt-2 px-3 py-1 text-sm text-blue-600 rounded-md hover:bg-white/10 dark:hover:bg-gray-700 transition"
      >
        + Add Header
      </button>
    </div>
  );
}
