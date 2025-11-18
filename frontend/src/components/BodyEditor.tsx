// FILE: frontend/src/components/BodyEditor.tsx
import React, { useState, useEffect } from "react";

interface BodyEditorProps {
  body: Record<string, any> | string;
  requestId: string;
  updateRequest: (id: string, updates: Partial<any>) => void;
}

export default function BodyEditor({ body, requestId, updateRequest }: BodyEditorProps) {
  const [localBody, setLocalBody] = useState<string>(
    typeof body === "string" ? body : JSON.stringify(body || {}, null, 2)
  );

  useEffect(() => {
    setLocalBody(typeof body === "string" ? body : JSON.stringify(body || {}, null, 2));
  }, [body]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLocalBody(text);
    try {
      const parsed = JSON.parse(text || "{}");
      updateRequest(requestId, { body: parsed });
    } catch {
      // wait for valid JSON
    }
  };

  return (
    <div className="mt-3 p-4 bg-white/20 dark:bg-gray-900/30 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      <textarea
        value={localBody}
        onChange={handleChange}
        className="w-full h-48 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/40 text-gray-900 dark:text-gray-100 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      />
    </div>
  );
}
