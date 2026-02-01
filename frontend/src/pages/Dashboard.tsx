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
import { ThemeProvider } from "../context/ThemeContext";

export default function Dashboard() {
  /* -------------------- STORES -------------------- */
  const { user, loading, isGuest } = useAuth();
  const {
    fetchCollections,
    setGuestInitialized,
    guestInitialized,
  } = useRequests();


  /* -------------------- UI STATE -------------------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [splitWidth, setSplitWidth] = useState<number>(() => {
    const saved = localStorage.getItem("reqflow-split");
    return saved ? parseFloat(saved) : 65;
  });
  const [isDragging, setIsDragging] = useState(false);

  const splitRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 768;

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
    let percentage = ((e.clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(30, Math.min(80, percentage));

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

      <ThemeProvider>
        <div className="min-h-screen md:h-screen flex flex-col
            overflow-y-auto md:overflow-y-hidden overflow-x-hidden
            bg-gray-900/70 backdrop-blur-md text-gray-100">

          {/* Topbar */}
          <div className="z-20 shadow-lg shadow-gray-800/40 flex-shrink-0">
            <Topbar />
          </div>

          {/* Main */}
          <div className="flex flex-1 overflow-hidden">

            {/* Sidebar */}
            <div
              className={`transition-all duration-300 md:translate-x-0 ${sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
                } z-30 flex-shrink-0`}
            >
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </div>

            {/* Workspace */}
            <div className="flex flex-1 flex-col overflow-hidden px-2 md:px-4">

              {/* Tabs */}
              <div className="flex-shrink-0 mb-3 z-10">
                <RequestTabs />
              </div>

              {/* Editor + Response */}
              <div
                ref={splitRef}
                className="flex flex-col md:flex-row md:flex-1
                  overflow-visible md:overflow-hidden
                  rounded-2xl border border-gray-700
                  bg-gray-800/40 shadow-inner backdrop-blur-xl"
              >
                {/* Editor */}
                <div
                  className="flex flex-col overflow-hidden"
                  style={!isMobile ? { width: `${splitWidth}%` } : {}}
                >
                  <RequestEditor />
                </div>

                {/* Divider */}
                <div
                  onMouseDown={startDrag}
                  className={`hidden md:block w-2 cursor-col-resize
                    bg-white/10 hover:bg-white/20
                    ${isDragging ? "bg-white/30 shadow-xl" : ""}`}
                />

                {/* Response */}
                <div
                  className="flex flex-col border-t md:border-t-0 md:border-l
                    border-gray-700"
                  style={
                    !isMobile
                      ? { width: `${100 - splitWidth}%` }
                      : { maxHeight: "80vh" }
                  }
                >
                  <div className="flex-1 overflow-auto">
                    <JsonViewer />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </ThemeProvider>
    </>
  );
}
