// FILE: frontend/src/components/Sidebar.tsx
import { useEffect, useState } from "react";
import { useRequests } from "../hooks/useRequests";
import { FaFolder, FaPlus, FaTrash, FaTimes } from "react-icons/fa";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCollection(newName);
    setNewName("");
  };

  const handleToggleCollection = async (id: string) => {
    if (activeCollection === id) {
      setActiveCollection(null);
    } else {
      setActiveCollection(id);
      // safely fetch requests
      await fetchRequests(id);
    }
  };

  const handleOpenRequest = (r: any) => {
    if (!r || !r._id) return; // ✅ prevent crash
    try {
      openRequest(r);
    } catch (e) {
      console.error("Error opening request:", e);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } md:hidden`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FaFolder className="text-brand-teal" /> Collections
          </h2>
          <button onClick={onClose} className="md:hidden text-gray-600 dark:text-gray-400">
            <FaTimes />
          </button>
        </div>

        {/* Add / Delete controls */}
        <div className="p-4 flex gap-2 border-b border-gray-300 dark:border-gray-700">
          <input
            className="w-full rounded-md bg-gray-200 dark:bg-gray-800 px-2 py-1 text-sm text-gray-800 dark:text-gray-100"
            placeholder="New collection"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <button
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-2 rounded transition"
            title="Add Collection"
          >
            <FaPlus size={12} />
          </button>

          {activeCollection && (
            <button
              onClick={() => deleteCollection(activeCollection)}
              className="bg-red-600 hover:bg-red-700 text-white px-2 rounded transition"
              title="Delete Active Collection"
            >
              <FaTrash size={12} />
            </button>
          )}
        </div>

        {/* Collections list */}
        <div className="overflow-y-auto h-[calc(100%-140px)] p-2">
          {collections.map((c) => {
            const requests = requestsByCollection?.[c._id] || [];

            return (
              <div key={c._id} className="mb-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleToggleCollection(c._id)}
                    className="flex-1 text-left px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-900 dark:text-gray-200 font-medium"
                  >
                    {c.name}
                  </button>
                  <button
                    onClick={() => deleteCollection(c._id)}
                    className="text-red-500 hover:text-red-600 p-1"
                    title="Delete Collection"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>

                {/* Requests */}
                {activeCollection === c._id && (
                  <div className="ml-5 mt-1 space-y-1">
                    {requests.length === 0 && (
                      <p className="text-xs text-gray-500 italic">No requests yet</p>
                    )}
                    {requests.map((r) => (
                      <button
                        key={r._id}
                        onClick={() => handleOpenRequest(r)}
                        className="block w-full text-left text-sm px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 truncate"
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
