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
    <div className="mt-4 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white/20 dark:bg-gray-900/30 backdrop-blur-md shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex relative">
        {/* Headers Tab */}
        <button
          onClick={() => setActiveTab("Headers")}
          className={`flex-1 px-3 py-2 text-center font-medium text-sm transition relative
            rounded-tl-2xl rounded-tr-none
            ${
              activeTab === "Headers"
                ? "text-gray-900 dark:text-white bg-white/30 dark:bg-gray-700/40 backdrop-blur-sm shadow-inner"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-gray-800/30"
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
                ? "text-gray-900 dark:text-white bg-white/30 dark:bg-gray-700/40 backdrop-blur-sm shadow-inner"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-gray-800/30"
            }`}
        >
          Body
        </button>

        {/* Smooth Gradient Underline */}
        <span
          className={`absolute bottom-0 h-1 rounded-full transition-all duration-300 ease-in-out
            ${activeTab === "Headers" ? "left-0 w-1/2" : "left-1/2 w-1/2"}
            bg-gradient-to-r from-gray-900/70 dark:from-white/70 to-gray-700/50 dark:to-gray-400/50`}
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
