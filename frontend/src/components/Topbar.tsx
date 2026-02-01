// FILE: frontend/src/components/Topbar.tsx
import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FaMoon, FaSun, FaSignOutAlt, FaUserSecret } from "react-icons/fa";
import { createPortal } from "react-dom";
import { FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { startTransition } from "react";

export default function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, isGuest, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const confirmLogout = async () => {
    setShowModal(false);
    await logout();

    startTransition(() => {
      navigate("/", { replace: true });
    });
  };


  const showLogout = user || isGuest;

  return (
    <>
      {/* Topbar */}
      <div
        className="
          flex items-center justify-between
          px-4 py-2
          border-b border-gray-300
          bg-gray-100/80 backdrop-blur-md
          dark:bg-gray-900/70 dark:border-gray-700
          shadow-sm
        "
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
            className="
              md:hidden p-2 rounded-md
              bg-gray-200 hover:bg-gray-300
              dark:bg-gray-800 dark:hover:bg-gray-700
              transition
            "
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>

          <h1
            className="
              text-xl sm:text-2xl font-bold tracking-wide
              bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400
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
                bg-blue-500/10 border border-blue-400/30
                text-xs text-blue-600 dark:text-blue-300
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
              bg-gray-200 hover:bg-gray-300
              dark:bg-gray-800 dark:hover:bg-gray-700
              transition
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
                flex items-center gap-2 px-3 py-2 rounded-md
                bg-red-500 hover:bg-red-600
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
              bg-black/40 backdrop-blur-sm
            "
          >
            <div
              className="
                relative w-full max-w-sm mx-4
                rounded-2xl
                bg-white/10 dark:bg-gray-900/30
                border border-white/20
                backdrop-blur-2xl
                shadow-2xl
                p-6 text-center
                text-gray-900 dark:text-white
              "
            >
              {/* Glow */}
              <div
                className="
                  absolute -inset-1 rounded-2xl
                  bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400
                  opacity-20 blur-2xl
                  pointer-events-none
                "
              />

              <h2 className="relative text-lg font-semibold mb-2">
                Confirm Logout
              </h2>

              <p className="relative text-sm text-gray-700 dark:text-gray-300 mb-6">
                {isGuest
                  ? "Exit guest mode and return to login?"
                  : "Are you sure you want to log out from ReqFlow?"}
              </p>

              <div className="relative flex justify-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="
                    px-4 py-2 rounded-md
                    bg-gray-300 hover:bg-gray-400
                    dark:bg-gray-700 dark:hover:bg-gray-600
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
