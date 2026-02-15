import React, { useState } from "react";
import HeaderEditor from "./HeaderEditor";
import BodyEditor from "./BodyEditor";

interface RequestContentTabsProps {
  headers: Record<string, string>;
  body: Record<string, any> | string;
  requestId: string;
  updateRequest: (id: string, updates: Partial<any>) => void;
}

export default function RequestContentTabs({
  headers,
  body,
  requestId,
  updateRequest,
}: RequestContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"Headers" | "Body">("Headers");

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex relative">
        {/* Headers Tab */}
        <button
          onClick={() => setActiveTab("Headers")}
          className={`flex-1 px-3 py-2 text-center font-medium text-sm transition relative
            rounded-tl-2xl rounded-tr-none
            ${
              activeTab === "Headers"
                ? "text-slate-900 dark:text-white bg-white/55 dark:bg-slate-700/45 backdrop-blur-sm shadow-inner"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-slate-800/35"
            }`}
        >
          Headers
        </button>

        {/* Body Tab */}
        <button
          onClick={() => setActiveTab("Body")}
          className={`flex-1 px-3 py-2 text-center font-medium text-sm transition relative
            rounded-tr-2xl rounded-tl-none
            ${
              activeTab === "Body"
                ? "text-slate-900 dark:text-white bg-white/55 dark:bg-slate-700/45 backdrop-blur-sm shadow-inner"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-slate-800/35"
            }`}
        >
          Body
        </button>

        {/* Smooth Gradient Underline */}
        <span
          className={`absolute bottom-0 h-1 rounded-full transition-all duration-300 ease-in-out
            ${activeTab === "Headers" ? "left-0 w-1/2" : "left-1/2 w-1/2"}
            bg-gradient-to-r from-cyan-500/80 via-indigo-500/80 to-fuchsia-500/70`}
        ></span>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "Headers" && (
          <HeaderEditor
            headers={headers}
            requestId={requestId}
            updateRequest={updateRequest}
          />
        )}
        {activeTab === "Body" && (
          <BodyEditor
            body={body}
            requestId={requestId}
            updateRequest={updateRequest}
          />
        )}
      </div>
    </div>
  );
}
