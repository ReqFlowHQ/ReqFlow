import React, { useMemo, useState } from "react";
import { useRequests } from "../hooks/useRequests";
import { html as beautifyHTML } from "js-beautify";

type ViewMode = "pretty" | "raw" | "headers";

export default function JsonViewer() {
  const { response, activeRequest } = useRequests();
  const currentResponse = response || activeRequest?.response || null;

  const [viewMode, setViewMode] = useState<ViewMode>("pretty");

  const parsed = useMemo(() => {
    if (!currentResponse?.data) return null;

    let raw: string;
    let type: "json" | "html" | "text";

    const data = currentResponse.data;

    // 🔥 UNWRAP backend runtime format
    if (typeof data === "object" && data !== null) {
      if ("html" in data && typeof data.html === "string") {
        raw = data.html;
        type = "html";
      } else if ("text" in data && typeof data.text === "string") {
        raw = data.text;
        type = "text";
      } else {
        // JSON object
        return {
          type: "json",
          raw: JSON.stringify(data),
          pretty: JSON.stringify(data, null, 2),
        };
      }
    } else {
      raw = String(data);
      type =
        raw.trim().startsWith("<!doctype") ||
          raw.trim().startsWith("<html")
          ? "html"
          : "text";
    }

    // 🔥 APPLY HTML BEAUTIFY ONLY HERE
    return {
      type,
      raw,
      pretty:
        type === "html"
          ? beautifyHTML(raw, {
            indent_size: 2,
            preserve_newlines: true,
            wrap_line_length: 80,
          })
          : raw,
    };
  }, [currentResponse]);



  if (!currentResponse)
    return (
      <div className="flex h-full items-center justify-center text-gray-400 italic">
        Response will appear here.
      </div>
    );

  const { status, statusText, time, headers } = currentResponse;

  return (
    <div
      data-json-viewer
      className="flex flex-col h-full min-h-0 bg-gray-50 dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700">


      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`px-2 py-1 rounded text-white ${status >= 200 && status < 300
              ? "bg-green-500"
              : status >= 400
                ? "bg-red-500"
                : "bg-yellow-500"
              }`}
          >
            {status} {statusText || ""}
          </span>
          <span className="text-gray-500">
            {typeof time === "number" ? `${time} ms` : "—"}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(["pretty", "raw", "headers"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-xs rounded ${viewMode === mode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm text-gray-800 dark:text-gray-100">
        {viewMode === "headers" && (
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">
            {JSON.stringify(headers || {}, null, 2)}
          </pre>
        )}

        {viewMode !== "headers" && parsed && (
          parsed.type === "json" && viewMode === "pretty" ? (
            <pre className="whitespace-pre-wrap break-words overflow-x-auto">
              {parsed.pretty}
            </pre>
          ) : (
            <pre className="whitespace-pre-wrap break-words overflow-x-auto">
              {viewMode === "pretty" ? parsed.pretty : parsed.raw}
            </pre>
          )
        )}
      </div>
    </div>
  );
}

