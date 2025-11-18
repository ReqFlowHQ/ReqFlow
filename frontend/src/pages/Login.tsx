import React from "react";
import { motion } from "framer-motion";

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/github";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-6 md:px-16 gap-10 md:gap-16">

      {/* Left: Logo + Description */}
      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-5 max-w-lg">
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          REQFLOW
        </motion.h1>

        <motion.p
          className="text-white/85 text-base md:text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          ReqFlow is a sleek and modern alternative to Postman. Designed for developers and teams, it allows you to send, test, and manage HTTP requests effortlessly. Minimal interface, smart request management, and built-in collaboration features make your workflow smoother.
        </motion.p>

        <motion.ul
          className="text-white/70 text-sm md:text-base list-disc list-inside space-y-1 md:space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <li>Organize requests with collections & tabs</li>
          <li>Send GET, POST, PUT, PATCH, DELETE requests</li>
          <li>Instantly view formatted JSON responses</li>
          <li>Supports OAuth, API keys, custom headers</li>
        </motion.ul>
      </div>

      {/* Right: Login Box */}
      <motion.div
        className="flex-1 max-w-md w-full p-10 rounded-2xl bg-white/10 dark:bg-gray-900/40 border border-white/20 shadow-2xl backdrop-blur-2xl relative"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <h2 className="text-3xl font-bold text-white mb-6 drop-shadow-md text-center md:text-left">
          Sign in
        </h2>
        <p className="text-white/70 mb-6 text-center md:text-left">
          Choose your preferred login method
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md hover:scale-105 hover:shadow-lg transition-transform"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <button
            onClick={handleGitHubLogin}
            className="flex items-center justify-center gap-3 bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:scale-105 hover:shadow-lg transition-transform"
          >
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub"
              className="w-5 h-5 invert"
            />
            Continue with GitHub
          </button>
        </div>

        <p className="text-white/70 text-xs mt-6 text-center md:text-left">
          By logging in, you agree to ReqFlow’s{" "}
          <a href="#" className="underline hover:text-white">Terms</a> &{" "}
          <a href="#" className="underline hover:text-white">Privacy Policy</a>.
        </p>

        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-10 blur-2xl pointer-events-none"></div>
      </motion.div>
    </div>
  );
}
