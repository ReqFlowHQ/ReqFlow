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
    activeTabIds,
    hasHydratedStorage,
    activeRequest,
    initializeEmptyRequest,
  } = useRequests(
    (state) => ({
      fetchCollections: state.fetchCollections,
      setGuestInitialized: state.setGuestInitialized,
      guestInitialized: state.guestInitialized,
      activeTabIds: state.activeTabIds,
      hasHydratedStorage: state.hasHydratedStorage,
      activeRequest: state.activeRequest,
      initializeEmptyRequest: state.initializeEmptyRequest,
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  const splitRef = useRef<HTMLDivElement>(null);
  const splitRafRef = useRef<number | null>(null);
  const pendingSplitWidthRef = useRef<number>(splitWidth);

  /* -------------------- SIDEBAR TOGGLE -------------------- */
  useEffect(() => {
    const handler = () => setSidebarOpen(true);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
      if (hasHydratedStorage && activeTabIds.length === 0 && !activeRequest) {
        initializeEmptyRequest();
      }
      return;
    }

    if (isGuest && activeTabIds.length === 0 && !activeRequest) {
      if (!guestInitialized) {
        setGuestInitialized();
      } else {
        initializeEmptyRequest();
      }
    }
  }, [
    loading,
    user,
    isGuest,
    guestInitialized,
    activeTabIds.length,
    hasHydratedStorage,
    activeRequest,
    fetchCollections,
    setGuestInitialized,
    initializeEmptyRequest,
  ]);


  /* -------------------- SPLIT DRAG -------------------- */
  const startDrag = (e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    pendingSplitWidthRef.current = splitWidth;
    setIsDragging(true);
  };

  const stopDrag = () => {
    if (splitRafRef.current !== null) {
      window.cancelAnimationFrame(splitRafRef.current);
      splitRafRef.current = null;
      setSplitWidth(pendingSplitWidthRef.current);
    }
    setIsDragging(false);
    localStorage.setItem("reqflow-split", pendingSplitWidthRef.current.toString());
  };

  const onDrag = (e: MouseEvent) => {
    if (!isDragging || !splitRef.current) return;

    const rect = splitRef.current.getBoundingClientRect();
    const safeWidth = Math.max(rect.width, 1);
    const minPercentByPx = (MIN_EDITOR_PX / safeWidth) * 100;
    const maxPercentByPx = 100 - (MIN_RESPONSE_PX / safeWidth) * 100;

    let minPercent = Math.max(30, minPercentByPx);
    let maxPercent = Math.min(80, maxPercentByPx);
    if (minPercent > maxPercent) {
      // Not enough horizontal room; prevent divider jumping to invalid positions.
      minPercent = pendingSplitWidthRef.current;
      maxPercent = pendingSplitWidthRef.current;
    }

    let percentage = ((e.clientX - rect.left) / safeWidth) * 100;
    percentage = Math.max(minPercent, Math.min(maxPercent, percentage));
    pendingSplitWidthRef.current = percentage;

    if (splitRafRef.current !== null) return;
    splitRafRef.current = window.requestAnimationFrame(() => {
      setSplitWidth(pendingSplitWidthRef.current);
      splitRafRef.current = null;
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        stopDrag();
      }
    };

    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("blur", stopDrag);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("blur", stopDrag);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (splitRafRef.current !== null) {
        window.cancelAnimationFrame(splitRafRef.current);
        splitRafRef.current = null;
      }
    };
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white text-lg">
        Loading...
      </div>
    );
  }
  if (!user && !isGuest) {
    return null;
  }

  const dashboardShellClassName = isMobile
    ? "relative min-h-screen w-full max-w-full overflow-x-hidden"
    : "relative min-h-screen overflow-hidden lg:h-screen";
  const dashboardFrameClassName = isMobile
    ? "relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden overflow-y-visible bg-gradient-to-br from-[#f8fbff] via-[#eff6ff] to-[#fdfcff] text-slate-900 dark:bg-gradient-to-br dark:from-[#0a0f1d] dark:via-[#111827] dark:to-[#05070f] dark:text-slate-100"
    : "relative flex min-h-screen flex-col overflow-y-auto overflow-x-hidden lg:h-screen lg:overflow-y-hidden bg-gradient-to-br from-[#f8fbff] via-[#eff6ff] to-[#fdfcff] text-slate-900 dark:bg-gradient-to-br dark:from-[#0a0f1d] dark:via-[#111827] dark:to-[#05070f] dark:text-slate-100";
  const mainLayoutClassName = isMobile
    ? "flex w-full max-w-full min-w-0 flex-col overflow-visible"
    : "flex w-full max-w-full flex-1 min-w-0 overflow-visible lg:overflow-hidden";
  const workspaceClassName = isMobile
    ? "flex w-full max-w-full min-w-0 flex-col overflow-x-hidden overflow-y-visible px-2 pb-4 lg:px-4 lg:pb-0"
    : "flex flex-1 min-w-0 flex-col overflow-visible lg:overflow-hidden px-2 pb-4 lg:px-4 lg:pb-0";
  const editorPaneClassName = isMobile
    ? "flex min-w-0 flex-col overflow-visible rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-700/80 dark:bg-slate-900/45 lg:rounded-none lg:border-0 lg:bg-transparent"
    : "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-700/80 dark:bg-slate-900/45 lg:rounded-none lg:border-0 lg:bg-transparent";
  const responseViewportClassName = isMobile
    ? "overflow-x-hidden overflow-y-visible"
    : "flex-1 overflow-visible lg:overflow-auto";
  const sidebarContainerClassName = isMobile
    ? "z-30"
    : `transition-all duration-300 md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } z-30 flex-shrink-0`;


  /* -------------------- RENDER -------------------- */
  return (
    <>
      <Helmet>
        <title>Dashboard · ReqFlow | OpenGraph Labs</title>
        <meta
          name="description"
          content="ReqFlow dashboard by OpenGraph Labs. Design, send, and manage API requests with a modern developer workflow."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className={dashboardShellClassName}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-[-80px] h-72 w-72 rounded-full bg-sky-400/25 blur-3xl dark:bg-cyan-400/15" />
          <div className="absolute bottom-[-100px] left-[-80px] h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl dark:bg-violet-500/15" />
        </div>
        <div className={dashboardFrameClassName}>

          {/* Topbar */}
          <div className="z-30 flex-shrink-0 sticky top-0 shadow-lg shadow-slate-300/40 dark:shadow-black/40">
            <Topbar />
          </div>

          {/* Main */}
          <div className={mainLayoutClassName}>

            {/* Sidebar */}
            <div className={sidebarContainerClassName}>
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </div>

            {/* Workspace */}
            <div className={workspaceClassName}>

              {/* Tabs */}
              <div className="flex-shrink-0 mb-3 z-20">
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
                  className={editorPaneClassName}
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
                  style={{
                    ...( !isMobile
                      ? { width: `${100 - splitWidth}%`, minWidth: `${MIN_RESPONSE_PX}px` }
                      : {}),
                    pointerEvents: isDragging ? "none" : "auto",
                  }}
                >
                  <div className={responseViewportClassName}>
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
