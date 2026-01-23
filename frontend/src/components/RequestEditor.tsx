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
  const { user } = useAuth();
  const navigate = useNavigate();

  const isGuest =
    sessionStorage.getItem("guest") === "true" && !user;
  const [resetAt, setResetAt] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState<string>("");

  const [guestRemaining, setGuestRemaining] =
    React.useState<number | null>(null);

  const {
    activeRequest,
    loading = false,
    updateRequest = () => { },
    deleteRequest = async () => { },
    saveRequest = async () => { },
    setLoading = () => { },
    setResponse = () => { },
  } = useRequests();

  /* -------------------- INIT GUEST QUOTA -------------------- */
  // ✅ ADDED: initialize guest quota visually
  React.useEffect(() => {
    if (!isGuest) return;

    api.get("/guest/status").then((res) => {
      if (typeof res.data?.remaining === "number") {
        setGuestRemaining(res.data.remaining);
      }

      // ✅ ADD THIS
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
      setLoading(true);

      const res = await api.post("/runtime/execute", {
        request: {
          method: activeRequest.method,
          url: activeRequest.url,
          headers: activeRequest.headers,
          body:
            activeRequest.method !== "GET" && activeRequest.body
              ? activeRequest.body
              : null,
        },
        meta: {
          save: !activeRequest.isTemporary,
          requestId: activeRequest._id ?? null,
        },
      });

      // ✅ SINGLE SOURCE OF TRUTH (success)
      const remaining = res.headers["x-guest-remaining"];
      if (remaining !== undefined) {
        setGuestRemaining(Number(remaining));
      }

      setResponse(res.data);
      toast.success("Request executed successfully 🚀");
    } catch (err: any) {
      // ✅ ALSO update quota on error (429)
      const remaining =
        err?.response?.headers?.["x-guest-remaining"];

      if (remaining !== undefined) {
        setGuestRemaining(Number(remaining));
      }

      toast.error(
        err?.response?.data?.message || "Request failed ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!requestId) return;
    await saveRequest(requestId);
    toast.success("Request saved successfully ✅");
  };

  const handleDelete = async () => {
    if (!requestId) return;
    await deleteRequest(requestId);
    toast.success("Request deleted 🗑️");
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="flex flex-col h-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">

      {/* Top bar */}
      <div className="flex items-center gap-2 p-3 flex-wrap border-b bg-gray-100 border-gray-300 dark:bg-gray-900 dark:border-gray-700">

        {isGuest && (
          <div
            className="w-full mb-2 flex items-center justify-between rounded-md
    bg-blue-500/10 border border-blue-400/30
    px-3 py-1 text-xs text-blue-300"
          >
            <div>
              <div>
                GET requests left:{" "}
                <strong>{guestRemaining ?? 5}</strong> / 5
              </div>

              {/* ✅ COUNTDOWN */}
              {countdown && (
                <div className="text-[11px] opacity-70">
                  {countdown}
                </div>
              )}
            </div>

            {guestRemaining === 0 && (
              <span className="opacity-80">
                Login required to continue
              </span>
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
        <input
          value={activeRequest.url || ""}
          onChange={(e) =>
            updateRequest(requestId, { url: e.target.value })
          }
          placeholder="Enter request URL..."
          className="flex-1 min-w-[180px] px-3 py-1 rounded-md
            bg-white text-gray-900 border border-gray-300
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />

        {/* Name */}
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

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="bg-yellow-500 px-3 py-1 rounded-md text-white"
          >
            <FaSave /> Save
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-600 px-3 py-1 rounded-md text-white"
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
            className={`px-3 py-1 rounded-md text-white ${guestLimitReached
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

      {/* Body / Headers */}
      <div className="flex flex-col p-3">
        <RequestContentTabs
          headers={activeRequest.headers || {}}
          body={activeRequest.body || {}}
          requestId={requestId}
          updateRequest={updateRequest}
        />
      </div>
    </div>
  );
}
