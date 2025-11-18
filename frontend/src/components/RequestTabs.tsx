// FILE: frontend/src/components/RequestTabs.tsx
import { useRequests } from "../hooks/useRequests";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";
import clsx from "clsx";

export default function RequestTabs() {
  const {
    activeTabIds,
    activeRequest,
    closeTab,
    openRequest,
    createRequest,
    requestsByCollection,
  } = useRequests();

  const allRequests = Object.values(requestsByCollection || {}).flat();

  const hasTabs = activeTabIds && activeTabIds.length > 0;

  return (
    <div className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700 min-h-[44px]">
      {/* Tabs container */}
      <div className="flex overflow-x-auto w-full">
        {hasTabs ? (
          activeTabIds.map((id) => {
            const request = allRequests.find((r) => r._id === id);
            if (!request) return null;

            const isActive = activeRequest?._id === id;
            const title = request.name?.trim() || "Untitled";

            return (
              <div
                key={id}
                className={clsx(
                  "flex items-center px-3 py-2 cursor-pointer border-r border-gray-200 dark:border-gray-700 select-none transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-brand-teal to-brand-purple text-white"
                    : "bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-300"
                )}
                onClick={() => openRequest(request)}
              >
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {title}
                </span>
                <button
                  className="ml-2 p-1 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(id);
                  }}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="flex items-center px-3 py-2 text-sm text-gray-500 italic">
            No requests open — create or select one from the sidebar.
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-2">
        <button
          onClick={() => createRequest?.()}
          className="p-2 rounded-full bg-brand-teal hover:bg-brand-purple text-white transition"
          title="New Request"
        >
          <FaPlus size={12} />
        </button>

        <button
          onClick={() => {
            if (activeRequest?._id) closeTab(activeRequest._id);
          }}
          className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
          title="Close Current Request"
        >
          <FaMinus size={12} />
        </button>
      </div>
    </div>
  );
}
