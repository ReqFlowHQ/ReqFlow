import React, { useEffect, useState } from "react";
import { useRequests } from "../hooks/useRequests";

export default function JsonViewer() {
  const { response, activeRequest } = useRequests();
  const [formattedOutput, setFormattedOutput] = useState<string>("");
  const [isHTML, setIsHTML] = useState(false);

  const currentResponse = response || activeRequest?.response || null;

  useEffect(() => {
    if (!currentResponse) {
      setFormattedOutput("");
      setIsHTML(false);
      return;
    }

    const data = currentResponse.data;

    if (!data) {
      setFormattedOutput("");
      setIsHTML(false);
      return;
    }

    try {
      // 🧩 Detect if backend sent HTML wrapped inside { html: "<!DOCTYPE html>..." }
      if (typeof data === "object" && data.html) {
        setIsHTML(true);
        setFormattedOutput(data.html);
      }
      // 🧩 Or if backend sent plain text
      else if (typeof data === "object" && data.text) {
        setIsHTML(false);
        setFormattedOutput(JSON.stringify({ text: data.text }, null, 2));
      }
      // 🧩 Otherwise assume JSON
      else if (typeof data === "object") {
        setIsHTML(false);
        setFormattedOutput(JSON.stringify(data, null, 2));
      }
      // 🧩 Raw HTML string case
      else if (typeof data === "string" && data.trim().startsWith("<!DOCTYPE")) {
        setIsHTML(true);
        setFormattedOutput(data);
      }
      else {
        setIsHTML(false);
        setFormattedOutput(JSON.stringify(data, null, 2));
      }
    } catch {
      setFormattedOutput("Invalid response format");
      setIsHTML(false);
    }
  }, [currentResponse, activeRequest?._id]);

  if (!currentResponse)
    return (
      <div className="flex h-full items-center justify-center text-gray-400 italic">
        Response will appear here.
      </div>
    );

  const { status, statusText, time, headers, data } = currentResponse;


  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`px-2 py-1 rounded text-white ${status >= 200 && status < 300
                ? "bg-green-500"
                : status >= 400
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
          >
            {status || "—"} {statusText || ""}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {typeof time === "number" && time > 0 ? `${time} ms` : "—"}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isHTML ? "HTML Response" : "JSON Response"}
        </span>
      </div>

      {/* Response body */}
      <div className="flex-1 overflow-auto p-4 text-sm font-mono text-gray-800 dark:text-gray-100">
        {isHTML ? (
          // 🧠 Render HTML safely in iframe sandbox
          <iframe
            sandbox=""
            srcDoc={formattedOutput}
            title="HTML Preview"
            className="w-full h-full bg-white rounded-lg shadow-inner"
          />
        ) : (
          <pre
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: highlightJSON(formattedOutput),
            }}
          />
        )}
      </div>
    </div>
  );
}

function highlightJSON(json: string): string {
  if (!json) return "";
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-gray-800 dark:text-gray-100";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = "text-purple-700 font-medium";
        else cls = "text-teal-700";
      } else if (/true|false/.test(match)) cls = "text-orange-600 font-semibold";
      else if (/null/.test(match)) cls = "text-pink-600 italic";
      else cls = "text-blue-700";
      return `<span class="${cls}">${match}</span>`;
    }
  );
}
