// FILE: frontend/src/pages/Dashboard.tsx
import { useState, useEffect, useRef } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import RequestTabs from "../components/RequestTabs";
import RequestEditor from "../components/RequestEditor";
import JsonViewer from "../components/JsonViewer";
import { useAuth } from "../context/AuthContext";
import { useRequests } from "../hooks/useRequests";
import { Helmet } from "react-helmet-async";
import { shallow } from "zustand/shallow";

export default function Dashboard() {
  const MIN_EDITOR_PX = 620;
  const MIN_RESPONSE_PX = 420;

  /* -------------------- STORES -------------------- */
  const { user, loading, isGuest } = useAuth();
  const {
    fetchCollections,
    setGuestInitialized,
    guestInitialized,
  } = useRequests(
    (state) => ({
      fetchCollections: state.fetchCollections,
      setGuestInitialized: state.setGuestInitialized,
      guestInitialized: state.guestInitialized,
    }),
    shallow
  );


  /* -------------------- UI STATE -------------------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [splitWidth, setSplitWidth] = useState<number>(() => {
    const saved = localStorage.getItem("reqflow-split");
    return saved ? parseFloat(saved) : 65;
  });
  const [isDragging, setIsDragging] = useState(false);

  const splitRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 1024;

  /* -------------------- SIDEBAR TOGGLE -------------------- */
  useEffect(() => {
    const handler = () => setSidebarOpen(true);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  /* -------------------- INIT FLOW (THE IMPORTANT PART) -------------------- */
  /* -------------------- AUTH GUARD -------------------- */
  if (!loading && !user && !isGuest) {
    return null;
  }

  useEffect(() => {
    if (loading) return;

    if (user) {
      fetchCollections();
      return;
    }

    if (isGuest && !guestInitialized) {
      setGuestInitialized();
    }
  }, [
    loading,
    user,
    isGuest,
    guestInitialized,
    fetchCollections,
    setGuestInitialized,
  ]);


  /* -------------------- SPLIT DRAG -------------------- */
  const startDrag = (e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const stopDrag = () => setIsDragging(false);

  const onDrag = (e: MouseEvent) => {
    if (!isDragging || !splitRef.current) return;

    const rect = splitRef.current.getBoundingClientRect();
    const minPercentByPx = (MIN_EDITOR_PX / rect.width) * 100;
    const maxPercentByPx = 100 - (MIN_RESPONSE_PX / rect.width) * 100;

    const minPercent = Math.max(30, minPercentByPx);
    const maxPercent = Math.min(80, maxPercentByPx);

    let percentage = ((e.clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(minPercent, Math.min(maxPercent, percentage));

    setSplitWidth(percentage);
    localStorage.setItem("reqflow-split", percentage.toString());
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", stopDrag);
    }
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [isDragging]);

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-lg">
        Loading...
      </div>
    );
  }
  if (!user && !isGuest) {
    return null;
  }


  /* -------------------- RENDER -------------------- */
  return (
    <>
      <Helmet>
        <title>Dashboard · ReqFlow | OpenGraph Labs</title>
        <meta
          name="description"
          content="ReqFlow dashboard by OpenGraph Labs. Design, send, and manage API requests with a modern developer workflow."
        />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden lg:h-screen">
        <div className="pointer-events-none absolute -top-24 right-[-80px] h-72 w-72 rounded-full bg-sky-400/25 blur-3xl dark:bg-cyan-400/15" />
        <div className="pointer-events-none absolute bottom-[-100px] left-[-80px] h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl dark:bg-violet-500/15" />
        <div
          className="relative flex min-h-screen flex-col overflow-y-auto overflow-x-hidden lg:h-screen lg:overflow-y-hidden
            bg-gradient-to-br from-[#f8fbff] via-[#eff6ff] to-[#fdfcff] text-slate-900
            dark:bg-gradient-to-br dark:from-[#0a0f1d] dark:via-[#111827] dark:to-[#05070f] dark:text-slate-100"
        >

          {/* Topbar */}
          <div className="z-30 flex-shrink-0 sticky top-0 shadow-lg shadow-slate-300/40 dark:shadow-black/40">
            <Topbar />
          </div>

          {/* Main */}
          <div className="flex flex-1 min-w-0 overflow-visible lg:overflow-hidden">

            {/* Sidebar */}
            <div
              className={`transition-all duration-300 md:translate-x-0 ${sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
                } z-30 flex-shrink-0`}
            >
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </div>

            {/* Workspace */}
            <div className="flex flex-1 min-w-0 flex-col overflow-visible lg:overflow-hidden px-2 pb-4 lg:px-4 lg:pb-0">

              {/* Tabs */}
              <div className="flex-shrink-0 mb-3 z-20 sticky top-[56px] lg:static">
                <RequestTabs />
              </div>

              {/* Editor + Response */}
              <div
                ref={splitRef}
                className="flex flex-col lg:flex-row lg:flex-1
                  min-w-0 w-full
                  overflow-visible lg:overflow-hidden
                  rounded-2xl border border-slate-200/70 bg-white/70
                  shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl
                  dark:border-slate-700/80 dark:bg-slate-900/50 dark:shadow-[0_20px_55px_rgba(2,6,23,0.5)]"
              >
                {/* Editor */}
                <div
                  className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-700/80 dark:bg-slate-900/45 lg:rounded-none lg:border-0 lg:bg-transparent"
                  style={
                    !isMobile
                      ? { width: `${splitWidth}%`, minWidth: `${MIN_EDITOR_PX}px` }
                      : {}
                  }
                >
                  <RequestEditor />
                </div>

                {/* Divider */}
                <div
                  onMouseDown={startDrag}
                  className={`hidden lg:block w-2 cursor-col-resize
                    bg-slate-300/50 hover:bg-slate-400/60 dark:bg-white/10 dark:hover:bg-white/20
                    ${isDragging ? "bg-slate-500/60 shadow-xl dark:bg-white/30" : ""}`}
                />

                {/* Response */}
                <div
                  className="flex min-w-0 flex-col border-t lg:border-t-0 lg:border-l
                    border-slate-200/70 dark:border-slate-700/80 bg-white/55 dark:bg-slate-900/55 min-h-[44vh] rounded-2xl lg:rounded-none lg:min-h-0"
                  style={
                    !isMobile
                      ? { width: `${100 - splitWidth}%`, minWidth: `${MIN_RESPONSE_PX}px` }
                      : {}
                  }
                >
                  <div className="flex-1 overflow-visible lg:overflow-auto">
                    <JsonViewer />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
