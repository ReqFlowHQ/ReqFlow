// FILE: frontend/src/components/Topbar.tsx
import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";

export default function Topbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const confirmLogout = () => {
    logout();
    setShowModal(false);
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-sm">
        {/* Brand Name */}
        <h1 className="text-lg font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 bg-clip-text text-transparent">
          ReqFlow
        </h1>

        {/* Right-side controls */}
        <div className="flex items-center space-x-4">
          {/* User Info */}
          {user && (
            <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
              {user.name || user.email}
            </span>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <FaSun className="text-yellow-400" />
            ) : (
              <FaMoon className="text-gray-800" />
            )}
          </button>

          {/* Logout Button */}
          {user && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3z py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
              title="Logout"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Glassmorphism Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-md shadow-xl max-w-sm text-center text-white">
            <h2 className="text-lg font-semibold mb-2">Confirm Logout</h2>
            <p className="text-sm text-gray-200 mb-6">
              Are you sure you want to log out from ReqFlow?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-500 hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
