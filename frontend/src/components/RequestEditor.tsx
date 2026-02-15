// FILE: frontend/src/components/RequestEditor.tsx
import React from "react";
import { useRequests } from "../hooks/useRequests";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaPaperPlane, FaTrash, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import RequestContentTabs from "./RequestContentTabs";
import api from "../api/axios";
import { shallow } from "zustand/shallow";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export default function RequestEditor() {
  /* -------------------- HOOKS -------------------- */
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 1024;



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
  } = useRequests(
    (state) => ({
      activeRequest: state.activeRequest,
      activeCollection: state.activeCollection,
      loading: state.loading,
      updateRequest: state.updateRequest,
      deleteRequest: state.deleteRequest,
      saveRequest: state.saveRequest,
      executeRequest: state.executeRequest,
      guestRemaining: state.guestRemaining,
    }),
    shallow
  );



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

  const scrollToResponseMobile = () => {
    if (!isMobile) return;
    requestAnimationFrame(() => {
      const responseEl = document.querySelector("[data-json-viewer]");
      if (!responseEl) return;

      const targetY = Math.max(
        0,
        responseEl.getBoundingClientRect().top + window.scrollY - 96
      );

      window.scrollTo({ top: targetY, behavior: "smooth" });
    });
  };

  /* -------------------- ACTIONS -------------------- */
  const handleSend = async () => {
    try {
      await executeRequest(requestId);
      scrollToResponseMobile();

      toast.success("Request executed successfully 🚀");
    } catch (err: any) {
      scrollToResponseMobile();
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
    <div className="flex flex-col h-full overflow-x-hidden">



      {/* Top bar */}
      {/* Top bar */}
      <div className="p-3 border-b border-slate-200/70 bg-white/55 dark:bg-slate-900/55 dark:border-slate-700/70 backdrop-blur-xl">
        <div className="flex w-full flex-col gap-2">

          {isGuest && (
            <div className="w-full mb-2 flex items-center justify-between rounded-lg bg-sky-500/10 border border-sky-400/40 px-3 py-2 text-xs text-sky-700 dark:text-sky-300">
              <div className="font-medium">
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


          <div className="flex w-full min-w-0 flex-col gap-2">
            <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
            {/* Method selector */}
            <select
              value={activeRequest.method}
              onChange={(e) => {
                const selected = e.target.value;
                if (isMethodLocked(selected)) return;
                updateRequest(requestId, { method: selected });
              }}
              className="w-full lg:w-[108px] lg:shrink-0 bg-white text-gray-900 border border-gray-300
              dark:bg-slate-800 dark:text-gray-100 dark:border-slate-600
              px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            >
              {METHODS.map((m) => (
                <option key={m} value={m} disabled={isMethodLocked(m)}>
                  {m} {isMethodLocked(m) ? "🔒" : ""}
                </option>
              ))}
            </select>

            {/* URL */}
            <div className="w-full min-w-0 flex-1 lg:min-w-[220px]">
              <input
                value={activeRequest.url || ""}
                onChange={(e) =>
                  updateRequest(requestId, { url: e.target.value })
                }
                placeholder="Enter request URL..."
                className="w-full min-w-0 px-3 py-2 rounded-lg
              bg-white/95 text-gray-900 border border-slate-300 shadow-sm
              dark:bg-slate-800/90 dark:text-gray-100 dark:border-slate-600
              focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              />
            </div>

            {/* Name */}
            <div className="w-full min-w-0 flex-1 lg:min-w-[220px]">
              <input
                value={activeRequest.name || ""}
                onChange={(e) =>
                  updateRequest(requestId, { name: e.target.value })
                }
                placeholder="Request name"
                className="w-full min-w-0 px-3 py-2 rounded-lg
              bg-white/95 text-gray-900 border border-slate-300 shadow-sm
              dark:bg-slate-800/90 dark:text-gray-100 dark:border-slate-600
              focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              />
            </div>
            </div>

            {/* Buttons (always second row) */}
            <div className="relative z-20 flex w-full flex-wrap items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isGuest}
                className="inline-flex min-h-[42px] flex-1 lg:flex-none items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-white text-sm font-medium transition shadow-sm"
              >
                <FaSave /> <span>Save</span>
              </button>

              <button
                onClick={handleDelete}
                className="inline-flex min-h-[42px] flex-1 lg:flex-none items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-lg text-white text-sm font-medium transition shadow-sm"
              >
                <FaTrash /> <span>Delete</span>
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
                className={`inline-flex min-h-[42px] w-full lg:w-auto items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium shadow-sm ${guestLimitReached
                  ? "bg-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:brightness-110"
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
