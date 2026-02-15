// FILE: frontend/src/components/RequestTabs.tsx
import { useRequests } from "../hooks/useRequests";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";
import clsx from "clsx";
import { useMemo } from "react";
import { shallow } from "zustand/shallow";

export default function RequestTabs() {
  const {
    activeTabIds,
    activeRequest,
    closeTab,
    openRequest,
    createTemporaryRequest,
    requestsByCollection,
  } = useRequests(
    (state) => ({
      activeTabIds: state.activeTabIds,
      activeRequest: state.activeRequest,
      closeTab: state.closeTab,
      openRequest: state.openRequest,
      createTemporaryRequest: state.createTemporaryRequest,
      requestsByCollection: state.requestsByCollection,
    }),
    shallow
  );

  /* -------------------- BUILD REQUEST LOOKUP -------------------- */
  const requestMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const list of Object.values(requestsByCollection || {})) {
      for (const request of list) {
        map.set(request._id, request);
      }
    }
    return map;
  }, [requestsByCollection]);

  const hasTabs = activeTabIds.length > 0;

  return (
    <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/80 min-h-[48px] bg-white/60 dark:bg-slate-900/45 backdrop-blur-md rounded-xl px-1 shadow-sm">
      {/* Tabs */}
      <div className="flex overflow-x-auto w-full min-w-0">
        {hasTabs ? (
          activeTabIds.map((id) => {
            const request = requestMap.get(id);
            if (!request) return null;

            const isActive = activeRequest?._id === id;
            const title = request.name?.trim() || "Untitled";

            return (
              <div
                key={id}
                onClick={() => openRequest(request)}
                className={clsx(
                  "m-1 flex shrink-0 items-center px-3 py-2 cursor-pointer rounded-lg border border-transparent select-none transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
                )}
              >
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {title}
                </span>
                <button
                  className="ml-2 p-1 rounded hover:bg-black/10 hover:text-rose-300 dark:hover:bg-white/10"
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
          <div className="flex items-center px-3 py-2 text-sm text-slate-500 italic">
            No requests open — create or select one from the sidebar.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-2">
        <button
          onClick={createTemporaryRequest}
          className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition shadow-sm"
          title="New Request"
        >
          <FaPlus size={12} />
        </button>

        <button
          onClick={() => {
            if (activeRequest?._id) {
              closeTab(activeRequest._id);
            }
          }}
          className="inline-flex p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition shadow-sm"
          title="Close Current Request"
        >
          <FaMinus size={12} />
        </button>
      </div>
    </div>
  );
}
