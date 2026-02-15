// FILE: frontend/src/components/Sidebar.tsx
import { useState } from "react";
import { useRequests } from "../hooks/useRequests";
import { FaFolder, FaPlus, FaTrash, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import type { RequestItem } from "../hooks/useRequests";
import { shallow } from "zustand/shallow";


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isGuest } = useAuth();
  const {
    collections,
    requestsByCollection,
    fetchRequests,
    createCollection,
    deleteCollection,
    openRequest,
    activeCollection,
    setActiveCollection,
  } = useRequests(
    (state) => ({
      collections: state.collections,
      requestsByCollection: state.requestsByCollection,
      fetchRequests: state.fetchRequests,
      createCollection: state.createCollection,
      deleteCollection: state.deleteCollection,
      openRequest: state.openRequest,
      activeCollection: state.activeCollection,
      setActiveCollection: state.setActiveCollection,
    }),
    shallow
  );

  const [newName, setNewName] = useState("");
  const isMobile = window.innerWidth < 1024;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCollection(newName.trim());
    setNewName("");
  };

  const handleToggleCollection = async (id: string) => {
    if (activeCollection === id) {
      setActiveCollection(null);
      return;
    }

    await fetchRequests(id);
    setActiveCollection(id);
  };



  const handleOpenRequest = (r: RequestItem) => {
    if (!r._id) return;
    openRequest(r);
    if (isMobile) onClose();
  };
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
  className={`
    ${isMobile
      ? `fixed top-0 left-0 z-50 h-full w-[290px] transform transition-transform duration-300
         ${isOpen ? "translate-x-0" : "-translate-x-full"}`
      : "relative h-full w-72 flex-shrink-0"}
    flex flex-col
    ${isMobile ? "bg-white dark:bg-slate-900 backdrop-blur-none" : "bg-white/75 dark:bg-slate-900/60 backdrop-blur-xl"}
    border-r border-slate-200/70 dark:border-slate-700/70
    shadow-[0_12px_40px_rgba(15,23,42,0.08)] dark:shadow-[0_15px_45px_rgba(2,6,23,0.35)]
  `}
>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/70 dark:border-slate-700/70">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <FaFolder className="text-cyan-500" />
            Collections
          </h2>
          {isMobile && (
            <button className="rounded-md p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition" onClick={onClose}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Create collection */}
        <div className="flex-shrink-0 p-3 flex gap-2 border-b border-slate-200/70 dark:border-slate-700/70">
          <input
            disabled={isGuest}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New collection"
            className="flex-1 px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
          />
          <button
            disabled={isGuest}
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 rounded-lg shadow-sm transition"
          >
            <FaPlus size={12} />
          </button>
        </div>

        {/* Collections */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {collections.map((c) => {
            const requests = requestsByCollection?.[c._id] || [];

            return (
              <div key={c._id} className="mb-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleToggleCollection(c._id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition ${
                      activeCollection === c._id
                        ? "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                        : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    {c.name}
                  </button>
                  <button
                    disabled={isGuest}
                    onClick={() => deleteCollection(c._id)}
                    className="text-rose-500 p-2 rounded-md hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>

                {activeCollection === c._id && (
                  <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-2 dark:border-slate-700">
                    {requests.length === 0 && (
                      <p className="text-xs text-slate-500 italic">
                        No requests yet
                      </p>
                    )}
                    {requests.map((r) => (
                      <button
                        key={r._id}
                        onClick={() => handleOpenRequest(r)}
                        className="block w-full text-left text-sm px-2 py-1.5 rounded-md truncate transition text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/70"
                      >
                        {r.name || "Untitled Request"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
