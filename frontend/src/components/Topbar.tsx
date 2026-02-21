// FILE: frontend/src/components/Topbar.tsx
import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FaMoon, FaSun, FaSignOutAlt, FaUserSecret, FaTimes } from "react-icons/fa";
import { createPortal } from "react-dom";
import { FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, isGuest, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const confirmLogout = () => {
    setShowModal(false);
    navigate("/", { replace: true });
    void logout();
  };


  const showLogout = user || isGuest;

  return (
    <>
      {/* Topbar */}
      <div
        className="
          flex items-center justify-between
          px-4 py-2.5
          border-b border-slate-200/80
          bg-white/70 backdrop-blur-xl
          dark:bg-slate-900/55 dark:border-slate-700/70
          shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_28px_rgba(2,6,23,0.35)]
        "
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
            className="
              md:hidden p-2 rounded-md
              bg-slate-200/80 hover:bg-slate-300/80
              dark:bg-slate-800/80 dark:hover:bg-slate-700
              transition shadow-sm
            "
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>

          <h1
            className="
              text-xl sm:text-2xl font-bold tracking-wide
              bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500
              bg-clip-text text-transparent
            "
          >
            ReqFlow
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
              {user.name || user.email}
            </span>
          )}

          {isGuest && (
            <span
              className="
                hidden sm:flex items-center gap-2 px-2 py-1 rounded-md
                bg-sky-500/10 border border-sky-400/30
                text-xs text-sky-700 dark:text-sky-300
              "
            >
              <FaUserSecret />
              Guest Mode
            </span>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="
              p-2 rounded-md
              bg-slate-200/80 hover:bg-slate-300/80
              dark:bg-slate-800 dark:hover:bg-slate-700
              transition shadow-sm
            "
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <FaSun className="text-yellow-400" />
            ) : (
              <FaMoon className="text-gray-800 dark:text-gray-200" />
            )}
          </button>

          {/* Logout */}
          {showLogout && (
            <button
              onClick={() => setShowModal(true)}
              className="
                flex items-center gap-2 px-3 py-2 rounded-md shadow-sm
                bg-rose-500 hover:bg-rose-600
                text-white text-sm font-medium
                transition
              "
              title="Logout"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* 🔮 Premium Glassmorphism Logout Modal */}
      {showModal &&
        createPortal(
          <div
            className="
              fixed inset-0 z-[9999]
              flex items-center justify-center
              bg-black/25 backdrop-blur-sm
            "
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-modal-title"
              aria-describedby="logout-modal-description"
              className="
                relative w-full max-w-sm mx-4 overflow-hidden
                rounded-2xl
                bg-white/22 dark:bg-slate-900/28
                border border-white/40 dark:border-slate-500/40
                backdrop-blur-3xl
                shadow-2xl shadow-slate-900/20 p-6 text-center
                text-slate-900 dark:text-white
              "
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent" />
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
                className="
                  absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center
                  rounded-full text-slate-500 transition-colors
                  hover:bg-white/40 hover:text-slate-800
                  dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white
                "
              >
                <FaTimes size={11} className="pointer-events-none" />
              </button>

              <h2 id="logout-modal-title" className="relative text-lg font-semibold mb-2">
                Confirm Logout
              </h2>

              <p
                id="logout-modal-description"
                className="relative text-sm text-gray-700 dark:text-gray-300 mb-6"
              >
                {isGuest
                  ? "Exit guest mode and return to home page?"
                  : "Are you sure you want to log out from ReqFlow?"}
              </p>

              <div className="relative flex justify-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="
                    px-4 py-2 rounded-md
                    border border-white/45 bg-white/30 hover:bg-white/45
                    dark:border-slate-400/50 dark:bg-white/10 dark:hover:bg-white/15
                    text-sm transition
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={confirmLogout}
                  className="
                    px-4 py-2 rounded-md
                    bg-red-500 hover:bg-red-600
                    text-white text-sm transition
                  "
                >
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
