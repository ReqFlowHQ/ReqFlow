// FILE: frontend/src/components/RequestEditor.tsx
import React from "react";
import { useRequests } from "../hooks/useRequests";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaPaperPlane, FaTrash, FaSave, FaLock, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import RequestContentTabs from "./RequestContentTabs";
import EnvironmentManager from "./EnvironmentManager";
import api from "../api/axios";
import { shallow } from "zustand/shallow";
import ModifiedRequestModal from "./ModifiedRequestModal";
import {
  resolveSendFlowAction,
  runModifiedRequestChoice,
} from "../utils/sendRequestFlow";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export default function RequestEditor() {
  /* -------------------- HOOKS -------------------- */
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 1024;



  const [resetAt, setResetAt] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState<string>("");
  const [showModifiedModal, setShowModifiedModal] = React.useState(false);
  const [methodMenuOpen, setMethodMenuOpen] = React.useState(false);
  const methodMenuRef = React.useRef<HTMLDivElement | null>(null);

  const {
    activeRequest,
    activeCollection,
    loading,
    updateRequest,
    deleteRequest,
    saveRequest,
    executeRequest,
    executeUnsavedActiveRequest,
    isActiveSavedRequestModified,
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
      executeUnsavedActiveRequest: state.executeUnsavedActiveRequest,
      isActiveSavedRequestModified: state.isActiveSavedRequestModified,
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

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!methodMenuRef.current) return;
      if (!methodMenuRef.current.contains(event.target as Node)) {
        setMethodMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMethodMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);



  /* -------------------- GUARDS -------------------- */
  if (!activeRequest) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 italic">
        Select a request from the sidebar to begin.
      </div>
    );
  }

  const requestId = activeRequest._id || "";
  const editorRootClassName = isMobile
    ? "block w-full max-w-full overflow-x-hidden overflow-y-visible"
    : "flex flex-col h-full overflow-x-hidden";
  const editorBodyClassName = isMobile
    ? "w-full max-w-full p-3 overflow-visible"
    : "flex-1 overflow-auto p-3";

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
    const sendAction = resolveSendFlowAction({
      isSavedRequest: !activeRequest.isTemporary,
      isModified: isActiveSavedRequestModified(),
    });
    if (sendAction === "prompt") {
      setShowModifiedModal(true);
      return;
    }

    try {
      await executeRequest(requestId);
      scrollToResponseMobile();

      toast.success("Request executed successfully 🚀");
    } catch (err: any) {
      scrollToResponseMobile();
      toast.error(err.message || "Request failed ❌");
    }
  };

  const handleSaveAndRun = async () => {
    setShowModifiedModal(false);
    try {
      await runModifiedRequestChoice({
        choice: "save-and-run",
        saveAndRun: async () => {
          await saveRequest(requestId);
          await executeRequest(requestId);
        },
        runWithoutSaving: executeUnsavedActiveRequest,
      });
      scrollToResponseMobile();
      toast.success("Request executed successfully 🚀");
    } catch (err: any) {
      scrollToResponseMobile();
      toast.error(err.message || "Request failed ❌");
    }
  };

  const handleRunWithoutSaving = async () => {
    setShowModifiedModal(false);
    try {
      await runModifiedRequestChoice({
        choice: "run-without-saving",
        saveAndRun: async () => {
          await saveRequest(requestId);
          await executeRequest(requestId);
        },
        runWithoutSaving: executeUnsavedActiveRequest,
      });
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
    <div className={editorRootClassName}>



      {/* Top bar */}
      {/* Top bar */}
      <div className="relative z-30 overflow-visible p-3 border-b border-slate-200/70 bg-white/55 dark:bg-slate-900/55 dark:border-slate-700/70 backdrop-blur-xl">
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


          <div className="flex w-full min-w-0 flex-col gap-2 overflow-visible">
            <div className="grid w-full min-w-0 grid-cols-1 gap-2 overflow-visible lg:grid-cols-[176px_minmax(0,1.6fr)_minmax(0,1fr)] lg:items-stretch">
            {/* Method selector */}
            <div className="relative z-40 w-[176px] min-w-[176px] max-w-[176px] shrink-0 overflow-visible" ref={methodMenuRef}>
              <div
                className="
                  relative flex h-11 w-full items-center rounded-lg border border-cyan-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 px-3 box-border
                  shadow-[0_4px_12px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_12px_rgba(2,6,23,0.35)]
                "
              >
                <span className="hidden lg:inline shrink-0 pr-2 text-[10px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                  METHOD
                </span>
                <button
                  type="button"
                  onClick={() => setMethodMenuOpen((open) => !open)}
                  className="
                    inline-flex h-full w-full min-w-0 items-center justify-between gap-2
                    bg-transparent px-0 box-border
                    text-sm leading-5 font-bold tracking-wide text-slate-900 dark:text-slate-100
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/45
                  "
                  aria-haspopup="listbox"
                  aria-expanded={methodMenuOpen}
                  aria-label="Select HTTP method"
                >
                  <span className="flex-1 whitespace-nowrap text-left">{activeRequest.method}</span>
                  <FaChevronDown
                    size={10}
                    className={`shrink-0 text-slate-500 transition-transform duration-200 ease-out dark:text-slate-300 ${
                      methodMenuOpen ? "rotate-180" : "rotate-0"
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  className={`absolute left-0 top-[calc(100%+6px)] z-[80] w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_28px_rgba(2,6,23,0.55)] transition-all duration-150 ease-out ${
                    methodMenuOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  }`}
                  role="listbox"
                  aria-label="HTTP method options"
                >
                  {METHODS.map((method) => {
                    const locked = isMethodLocked(method);
                    const isSelected = activeRequest.method === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        disabled={locked}
                        onClick={() => {
                          if (locked) return;
                          updateRequest(requestId, { method });
                          setMethodMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 first:rounded-t-lg last:rounded-b-lg ${
                          isSelected
                            ? "bg-cyan-50 text-slate-900 dark:bg-cyan-500/15 dark:text-white"
                            : locked
                              ? "cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                              : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="font-medium">{method}</span>
                        {locked ? <FaLock size={10} className="opacity-80" /> : null}
                      </button>
                    );
                  })}
                </div>
                {isGuest && activeRequest.method !== "GET" && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-slate-200/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700/70 dark:text-slate-300"
                    title="Guest mode allows only GET"
                  >
                    <FaLock size={9} />
                    Locked
                  </span>
                )}
              </div>
            </div>

            {/* URL */}
            <div className="w-full min-w-0">
              <input
                value={activeRequest.url || ""}
                onChange={(e) =>
                  updateRequest(requestId, { url: e.target.value })
                }
                placeholder="Enter request URL..."
                className="w-full min-w-0 px-3 py-2 rounded-lg
              h-11 box-border bg-white/95 text-gray-900 border border-slate-300 shadow-sm
              text-sm leading-5
              dark:bg-slate-800/90 dark:text-gray-100 dark:border-slate-600
              focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              />
            </div>

            {/* Name */}
            <div className="w-full min-w-0">
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
      <div className={editorBodyClassName}>
        <EnvironmentManager />
        <RequestContentTabs
          params={activeRequest.params || {}}
          auth={activeRequest.auth || { type: "none" }}
          headers={activeRequest.headers || {}}
          body={activeRequest.body || {}}
          requestId={requestId}
          updateRequest={updateRequest}
        />
      </div>
      <ModifiedRequestModal
        open={showModifiedModal}
        onClose={() => setShowModifiedModal(false)}
        onSaveAndRun={handleSaveAndRun}
        onRunWithoutSaving={handleRunWithoutSaving}
      />
    </div >

  );
}
