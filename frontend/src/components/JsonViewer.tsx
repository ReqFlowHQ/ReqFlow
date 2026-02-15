import React, { useMemo, useState } from "react";
import { useRequests } from "../hooks/useRequests";
import { html as beautifyHTML } from "js-beautify";
import { shallow } from "zustand/shallow";

type ViewMode = "pretty" | "raw" | "headers";

export default function JsonViewer() {
  const { response, activeRequest } = useRequests(
    (state) => ({
      response: state.response,
      activeRequest: state.activeRequest,
    }),
    shallow
  );
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
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400 italic">
        Response will appear here.
      </div>
    );

  const { status, statusText, time, headers } = currentResponse;

  return (
    <div
      data-json-viewer
      className="flex min-w-0 flex-col h-full min-h-[44vh] md:min-h-0 bg-gradient-to-br from-white/80 via-slate-50/70 to-white/70 dark:bg-gradient-to-br dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-950/60 border-l border-slate-200/70 dark:border-slate-700/70 backdrop-blur-xl">


      {/* Header */}
      <div className="flex-shrink-0 min-w-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-200/70 dark:border-slate-700/70 bg-white/65 dark:bg-slate-900/70">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span
            className={`px-2.5 py-1 rounded-md text-white shadow-sm ${status >= 200 && status < 300
              ? "bg-emerald-500"
              : status >= 400
                ? "bg-rose-500"
                : "bg-amber-500"
              }`}
          >
            {status} {statusText || ""}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {typeof time === "number" ? `${time} ms` : "—"}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 w-full sm:w-auto overflow-x-auto">
          {(["pretty", "raw", "headers"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs rounded-md transition ${viewMode === mode
                ? "bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white shadow-sm"
                : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-600/80"
                }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 overflow-visible lg:overflow-auto p-4 font-mono text-sm text-slate-800 dark:text-slate-100">
        {viewMode === "headers" && (
          <pre className="max-w-full whitespace-pre-wrap break-all overflow-x-auto">
            {JSON.stringify(headers || {}, null, 2)}
          </pre>
        )}

        {viewMode !== "headers" && parsed && (
          parsed.type === "json" && viewMode === "pretty" ? (
            <pre className="max-w-full whitespace-pre-wrap break-all overflow-x-auto">
              {parsed.pretty}
            </pre>
          ) : (
            <pre className="max-w-full whitespace-pre-wrap break-all overflow-x-auto">
              {viewMode === "pretty" ? parsed.pretty : parsed.raw}
            </pre>
          )
        )}
      </div>
    </div>
  );
}
