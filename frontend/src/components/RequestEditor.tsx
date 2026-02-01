// FILE: frontend/src/components/RequestEditor.tsx
import React from "react";
import { useRequests } from "../hooks/useRequests";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaPaperPlane, FaTrash, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import RequestContentTabs from "./RequestContentTabs";
import api from "../api/axios";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export default function RequestEditor() {
  /* -------------------- HOOKS -------------------- */
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;



  const [resetAt, setResetAt] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState<string>("");

  const {
    activeRequest,
    activeCollection,
    loading,
    updateRequest,
    deleteRequest,
    saveRequest,
    executeRequest,
    guestRemaining,
  } = useRequests();



  /* -------------------- INIT GUEST QUOTA -------------------- */
  // ✅ ADDED: initialize guest quota visually
  React.useEffect(() => {
  if (!isGuest) return;

  api.get("/guest/status").then((res) => {
    if (typeof res.data?.remaining === "number") {
      useRequests.getState().setGuestRemaining(res.data.remaining);
    }

    if (res.data?.resetAt) {
      setResetAt(res.data.resetAt);
    }
  });
}, [isGuest]);

  /* -------------------- COUNTDOWN TIMER -------------------- */
  React.useEffect(() => {
    if (!resetAt) return;

    const updateCountdown = () => {
      const resetTime = new Date(resetAt).getTime();
      const now = Date.now();
      const diff = resetTime - now;

      if (diff <= 0) {
        setCountdown("Resetting soon...");
        return;
      }

      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setCountdown(`Resets in ${hours}h ${minutes}m`);
    };

    updateCountdown(); // run immediately
    const interval = setInterval(updateCountdown, 60 * 1000); // every minute

    return () => clearInterval(interval);
  }, [resetAt]);



  /* -------------------- GUARDS -------------------- */
  if (!activeRequest) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 italic">
        Select a request from the sidebar to begin.
      </div>
    );
  }

  const requestId = activeRequest._id || "";

  const guestLimitReached =
    isGuest && guestRemaining !== null && guestRemaining <= 0;

  const isMethodLocked = (method: string) =>
    isGuest && method !== "GET";

  /* -------------------- ACTIONS -------------------- */
  const handleSend = async () => {
    try {
      await executeRequest(requestId);

      // 🔥 re-fetch quota after execution
      if (isMobile) {
        setTimeout(() => {
          document
            .querySelector('[data-json-viewer]')
            ?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }

      toast.success("Request executed successfully 🚀");
    } catch (err: any) {
      toast.error(err.message || "Request failed ❌");
    }
  };


  const handleDelete = async () => {
    if (!requestId) return;

    try {
      await deleteRequest(requestId);
      toast.success("Request deleted 🗑️");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete request ❌");
    }
  };

  const handleSave = async () => {
    if (!requestId) return;

    if (!activeCollection) {
      toast.error("Please select a collection before saving");
      return;
    }

    // 🔥 CRITICAL FIX
    updateRequest(requestId, { collection: activeCollection });

    try {
      await saveRequest(requestId);
      toast.success("Request saved successfully ✅");
    } catch (err: any) {
      toast.error(err.message || "Failed to save request ❌");
    }
  };


  /* -------------------- UI -------------------- */
  return (
    <div className="flex flex-col h-full">



      {/* Top bar */}
      {/* Top bar */}
      <div className="p-3 border-b border-gray-300 bg-gray-100 dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">

          {isGuest && (
            <div className="w-full mb-2 flex items-center justify-between rounded-md
        bg-blue-500/10 border border-blue-400/30 px-3 py-1 text-xs text-blue-300">
              <div>
                GET requests left: <strong>{guestRemaining ?? 5}</strong> / 5
                {countdown && (
                  <div className="text-[11px] opacity-70">{countdown}</div>
                )}
              </div>
              {guestRemaining === 0 && (
                <span className="opacity-80">Login required</span>
              )}
            </div>
          )}


          {/* Method selector */}
          <select
            value={activeRequest.method}
            onChange={(e) => {
              const selected = e.target.value;
              if (isMethodLocked(selected)) return;
              updateRequest(requestId, { method: selected });
            }}
            className="bg-white text-gray-900 border border-gray-300
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600
            px-2 py-1 rounded-md"
          >
            {METHODS.map((m) => (
              <option key={m} value={m} disabled={isMethodLocked(m)}>
                {m} {isMethodLocked(m) ? "🔒" : ""}
              </option>
            ))}
          </select>

          {/* URL */}
          <div className="flex flex-col md:flex-row gap-2 flex-1">
            <input
              value={activeRequest.url || ""}
              onChange={(e) =>
                updateRequest(requestId, { url: e.target.value })
              }
              placeholder="Enter request URL..."
              className="flex-1 min-w-[180px] px-3 py-1 rounded-md
            bg-white text-gray-900 border border-gray-300
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            /></div>

          {/* Name */}
          <div className="flex flex-col md:flex-row gap-2 flex-1">
            <input
              value={activeRequest.name || ""}
              onChange={(e) =>
                updateRequest(requestId, { name: e.target.value })
              }
              placeholder="Request name"
              className="flex-1 min-w-[180px] px-3 py-1 rounded-md
            bg-white text-gray-900 border border-gray-300
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 relative z-20">
              <button
                onClick={handleSave}
                disabled={isGuest}
                className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-md text-white text-sm transition"
              >
                <FaSave /> Save
              </button>

              <button
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-md text-white text-sm transition"
              >
                <FaTrash /> Delete
              </button>

              <button
                onClick={() => {
                  if (guestLimitReached) {
                    navigate("/login");
                    return;
                  }
                  handleSend();
                }}
                disabled={loading || guestLimitReached}
                className={`px-3 py-2 rounded-md text-white text-sm ${guestLimitReached
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-brand-teal hover:bg-brand-purple"
                  }`}
              >
                <FaPaperPlane />
                {guestLimitReached
                  ? "Login for Full Access"
                  : loading
                    ? "Sending..."
                    : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Body / Headers */}
      <div className="flex-1 overflow-auto p-3">
        <RequestContentTabs
          headers={activeRequest.headers || {}}
          body={activeRequest.body || {}}
          requestId={requestId}
          updateRequest={updateRequest}
        />
      </div>
    </div >

  );
}
