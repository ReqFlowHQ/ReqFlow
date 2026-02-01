import React from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import api from "../api/axios";
import { useRequests } from "../hooks/useRequests";
import SafeLink from "../components/SafeLink";

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleGitHubLogin = () => {
    window.location.href = "/api/auth/github";
  };


  const enterGuest = async () => {
    try {
      await api.post("/auth/force-logout", {}, { withCredentials: true });
    } catch { }

    localStorage.removeItem("guest");
    localStorage.removeItem("guest-get-count");

    localStorage.setItem("guest", "true");
    localStorage.setItem("guest-get-count", "0");

    useRequests.getState().hardReset();

    window.location.href = "/dashboard";
  };



  return (
    <>
      <Helmet>
        <title>Login · ReqFlow | OpenGraph Labs</title>
        <meta
          name="description"
          content="Sign in to ReqFlow by OpenGraph Labs. Manage and test your APIs with a modern developer-first workflow."
        />
      </Helmet>

      {/* 🌈 BACKGROUND */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-6">
        {/* 🧱 CONTENT */}
        <div
          className="
    w-full max-w-6xl
    grid grid-cols-1
    md:grid-cols-[1.2fr_0.8fr]
    items-center
    gap-12 lg:gap-16
  "
        >


          {/* LEFT PANEL */}
          <motion.div
            className="md:w-[480px] flex flex-col items-center md:items-start text-center md:text-left space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              REQFLOW
            </motion.h1>

            <motion.p
              className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              ReqFlow is a sleek and modern alternative to Postman. Designed for developers
              and teams to send, test, and manage HTTP requests effortlessly.
            </motion.p>

            <motion.ul
              className="hidden md:block text-white/70 text-base list-disc list-inside space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <li>Send GET, POST, PUT, PATCH, DELETE requests</li>
              <li>Instantly view formatted JSON responses</li>
              <li>Supports OAuth, API keys, custom headers</li>
            </motion.ul>
          </motion.div>

          {/* RIGHT PANEL — LOGIN CARD */}
          <motion.div
            className="w-full max-w-md p-6 sm:p-7 md:p-10 rounded-2xl bg-white/10 border border-white/20 shadow-2xl backdrop-blur-2xl relative"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* ✅ LOGIN CONTENT — MUST LIVE INSIDE THIS DIV */}

            <h2 className="text-3xl font-bold text-white mb-6 text-center md:text-left">
              Sign in
            </h2>

            <p className="text-white/70 mb-6 text-center md:text-left">
              Choose your preferred login method
            </p>

            <div className="flex flex-col gap-4">
              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-md active:scale-[0.98] transition-transform duration-150"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </button>

              {/* GitHub */}
              <button
                onClick={handleGitHubLogin}
                className="flex items-center justify-center gap-3 bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg shadow-md active:scale-[0.98] transition-transform duration-150"
              >
                <img
                  src="https://www.svgrepo.com/show/512317/github-142.svg"
                  alt="GitHub"
                  className="w-5 h-5 invert"
                />
                Continue with GitHub
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-xs text-white/60">or</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              {/* Guest */}
              <button
                onClick={enterGuest}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-white/30 text-white/90 text-sm hover:bg-white/10 active:scale-[0.98] transition"
              >
                Continue as Guest
                <span className="text-xs opacity-60">(5 GET/day)</span>
              </button>
            </div>

            <p className="text-white/70 text-xs mt-6 text-center md:text-left">
              By logging in, you agree to ReqFlow’s{" "}
              <SafeLink to="/terms" className="underline hover:text-white">
                Terms
              </SafeLink>
              {" & "}
              <SafeLink to="/privacy" className="underline hover:text-white">
                Privacy Policy
              </SafeLink>
            </p>

            <p className="text-white/50 text-xs mt-2 text-center md:text-left">

              <SafeLink to="/about" className="underline hover:text-white">
                About ReqFlow
              </SafeLink>
            </p>

            {/* Glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-10 blur-2xl pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </>
  );

}
