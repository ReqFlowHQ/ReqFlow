// FILE: frontend/src/components/Sidebar.tsx
import { useState } from "react";
import { useRequests } from "../hooks/useRequests";
import { FaFolder, FaPlus, FaTrash, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import type { RequestItem } from "../hooks/useRequests";


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isGuest } = useAuth();
  const {
    collections,
    requestsByCollection,
    fetchCollections,
    fetchRequests,
    createCollection,
    deleteCollection,
    openRequest,
    activeCollection,
    setActiveCollection,
  } = useRequests();

  const [newName, setNewName] = useState("");
  const isMobile = window.innerWidth < 768;

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
            ? `fixed top-0 left-0 z-50 h-full w-[280px] transform transition-transform duration-300
               ${isOpen ? "translate-x-0" : "-translate-x-full"}`
            : "relative h-full w-64 flex-shrink-0"}
          bg-gray-100 dark:bg-gray-900
          border-r border-gray-300 dark:border-gray-700
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FaFolder className="text-brand-teal" />
            Collections
          </h2>
          {isMobile && (
            <button onClick={onClose}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Create collection */}
        <div className="p-3 flex gap-2 border-b border-gray-300 dark:border-gray-700">
          <input
            disabled={isGuest}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New collection"
            className="flex-1 px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-sm"
          />
          <button
            disabled={isGuest}
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-2 rounded"
          >
            <FaPlus size={12} />
          </button>
        </div>

        {/* Collections */}
        <div className="overflow-y-auto p-2 h-full">
          {collections.map((c) => {
            const requests = requestsByCollection?.[c._id] || [];

            return (
              <div key={c._id} className="mb-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleToggleCollection(c._id)}
                    className="flex-1 text-left px-2 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    {c.name}
                  </button>
                  <button
                    disabled={isGuest}
                    onClick={() => deleteCollection(c._id)}
                    className="text-red-500 p-1"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>

                {activeCollection === c._id && (
                  <div className="ml-4 mt-1 space-y-1">
                    {requests.length === 0 && (
                      <p className="text-xs text-gray-500 italic">
                        No requests yet
                      </p>
                    )}
                    {requests.map((r) => (
                      <button
                        key={r._id}
                        onClick={() => handleOpenRequest(r)}
                        className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 truncate"
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
