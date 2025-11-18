// FILE: frontend/src/pages/Dashboard.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import RequestTabs from "../components/RequestTabs";
import RequestEditor from "../components/RequestEditor";
import JsonViewer from "../components/JsonViewer";
import { useAuth } from "../context/AuthContext";
import { useRequests } from "../hooks/useRequests";

export default function Dashboard() {
  const { fetchCollections } = useRequests();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [splitWidth, setSplitWidth] = useState<number>(() => {
    const saved = localStorage.getItem("reqflow-split");
    return saved ? parseFloat(saved) : 65;
  });
  const [isDragging, setIsDragging] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();
  const splitRef = useRef<HTMLDivElement>(null);

  // Redirect to login if no token
  useEffect(() => {
    if (!token && !(sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken"))) {
      navigate("/login", { replace: true });
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) fetchCollections();
  }, [fetchCollections]);

  // Drag logic
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const stopDrag = () => setIsDragging(false);

  const onDrag = (e: MouseEvent) => {
    if (!isDragging || !splitRef.current) return;
    const container = splitRef.current;
    const rect = container.getBoundingClientRect();
    let percentage = ((e.clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(30, Math.min(80, percentage));
    const editor = container.querySelector<HTMLDivElement>(':scope > div:first-child');
    const response = container.querySelector<HTMLDivElement>(':scope > div:last-child');
    if (editor && response) {
      editor.style.width = `${percentage}%`;
      response.style.width = `${100 - percentage}%`;
    }
    setSplitWidth(percentage);
    localStorage.setItem("reqflow-split", percentage.toString());
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", stopDrag);
    } else {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    }
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [isDragging]);

  if (!token && !localStorage.getItem("accessToken")) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-lg">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-900/70 backdrop-blur-md text-gray-100">
      {/* Topbar */}
      <div className="z-20 shadow-lg shadow-gray-800/40">
        <Topbar />
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`transition-all duration-300 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } z-30`}
        >
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile Menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-20 left-3 md:hidden bg-gradient-to-r from-brand-purple to-brand-teal text-white p-2 rounded-lg shadow-md hover:opacity-90 transition z-40"
        >
          ☰
        </button>

        {/* Workspace Area */}
        <div className="flex-1 flex flex-col overflow-hidden px-2 md:px-4">
          {/* Tabs */}
          <div className="mb-3">
            <RequestTabs />
          </div>

          {/* Editor + Response */}
          <div
            ref={splitRef}
            className="flex flex-1 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/40 shadow-inner shadow-gray-900/50 backdrop-blur-xl relative transition-all"
          >
            {/* Request Editor */}
            <div className="overflow-auto transition-all duration-200" style={{ width: `${splitWidth}%` }}>
              <RequestEditor />
            </div>

            {/* Divider */}
            <div
              onMouseDown={startDrag}
              className={`hidden md:block w-2 cursor-col-resize transition-all duration-150 rounded-full bg-white/10 hover:bg-white/20 hover:shadow-lg ${
                isDragging ? "bg-white/30 shadow-xl" : ""
              }`}
              style={{ backdropFilter: "blur(6px)" }}
            />

            {/* JSON Viewer */}
            <div
              className="flex-1 overflow-auto border-t md:border-t-0 md:border-l border-gray-700 transition-all duration-200"
              style={{ width: `${100 - splitWidth}%` }}
            >
              <JsonViewer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
