// FILE: frontend/src/components/BodyEditor.tsx
import React, { useState, useEffect } from "react";

interface BodyEditorProps {
  body: string | Record<string, any>;
  requestId: string;
  updateRequest: (id: string, updates: Partial<any>) => void;
}

export default function BodyEditor({
  body,
  requestId,
  updateRequest,
}: BodyEditorProps) {
  const [localBody, setLocalBody] = useState("");

  useEffect(() => {
    if (typeof body === "string") {
      setLocalBody(body);
    } else if (body && Object.keys(body).length > 0) {
      setLocalBody(JSON.stringify(body, null, 2));
    } else {
      setLocalBody("");
    }
  }, [body]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLocalBody(text);

    // 🔑 Store RAW STRING — no parsing here
    updateRequest(requestId, { body: text });
  };

  return (
    <div className="mt-3 p-4 bg-white/20 dark:bg-gray-900/30 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      <textarea
        value={localBody}
        onChange={handleChange}
        placeholder="Enter raw body (JSON, form data, text, etc.)"
        className="w-full h-40 md:h-48px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/30 dark:bg-gray-800/40 text-gray-900 dark:text-gray-100 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      />
    </div>
  );
}

