import React, { useState } from "react";
import HeaderEditor from "./HeaderEditor";
import BodyEditor from "./BodyEditor";
import QueryParamsEditor from "./QueryParamsEditor";
import type { RequestAuth } from "../utils/requestAuth";
import AuthEditor from "./AuthEditor";

interface RequestContentTabsProps {
  params: Record<string, string>;
  auth: RequestAuth;
  headers: Record<string, string>;
  body: Record<string, any> | string;
  requestId: string;
  updateRequest: (id: string, updates: Partial<any>) => void;
}

export default function RequestContentTabs({
  params,
  auth,
  headers,
  body,
  requestId,
  updateRequest,
}: RequestContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"Headers" | "Params" | "Auth" | "Body">("Headers");

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/45 dark:bg-slate-900/45 backdrop-blur-xl shadow-sm overflow-visible">
      {/* Tabs */}
      <div className="flex relative">
        {(["Headers", "Params", "Auth", "Body"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-center font-medium text-sm transition relative
              ${
                activeTab === tab
                  ? "text-slate-900 dark:text-white bg-white/55 dark:bg-slate-700/45 backdrop-blur-sm shadow-inner"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-slate-800/35"
              }`}
          >
            {tab}
          </button>
        ))}

        <span
          className={`absolute bottom-0 h-1 w-1/4 rounded-full transition-all duration-300 ease-in-out bg-gradient-to-r from-cyan-500/80 via-indigo-500/80 to-fuchsia-500/70
            ${
              activeTab === "Headers"
                ? "left-0"
                : activeTab === "Params"
                  ? "left-1/4"
                  : activeTab === "Auth"
                    ? "left-2/4"
                    : "left-3/4"
            }`}
        />
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
        {activeTab === "Params" && (
          <QueryParamsEditor
            params={params}
            requestId={requestId}
            updateRequest={updateRequest}
          />
        )}
        {activeTab === "Auth" && (
          <AuthEditor
            auth={auth}
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
