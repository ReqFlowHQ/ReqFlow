import React from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import api from "../api/axios";
import { useRequests } from "../hooks/useRequests";
import SafeLink from "../components/SafeLink";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

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
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://reqflow.onlineappsandservices.online/login" />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden bg-[#0b1220] px-4 py-8 sm:px-6 md:flex md:items-center md:justify-center md:py-12">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
          <motion.div
            className="order-1 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:order-1 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="text-center text-3xl font-extrabold tracking-wide text-white sm:text-4xl md:text-left md:text-6xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              REQFLOW
            </motion.h1>

            <motion.p
              className="mt-3 text-center text-sm leading-relaxed text-white/80 sm:text-base md:mt-5 md:max-w-xl md:text-left md:text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              Fast API testing with cleaner workflows, sharable collections, and execution history that feels instant on every device.
            </motion.p>

            <motion.div
              className="mt-4 flex flex-wrap justify-center gap-2 md:mt-6 md:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="rounded-full border border-cyan-300/40 bg-cyan-300/15 px-3 py-1 text-xs font-medium text-cyan-100">Fast Proxy</span>
              <span className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-xs font-medium text-emerald-100">Saved Requests</span>
              <span className="rounded-full border border-indigo-300/40 bg-indigo-300/15 px-3 py-1 text-xs font-medium text-indigo-100">Team Ready</span>
            </motion.div>
          </motion.div>

          <motion.div
            className="order-2 w-full rounded-3xl border border-white/20 bg-white/10 p-5 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-7 md:order-2 md:p-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-center text-2xl font-bold text-white sm:text-3xl md:text-left">
              Sign in
            </h2>
            <p className="mt-2 text-center text-sm text-white/70 md:text-left">
              Continue with your account or try guest mode
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                className="group relative overflow-hidden flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-gray-800 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.28)] active:translate-y-0 active:scale-[0.985]"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <FcGoogle className="h-5 w-5" />
                Continue with Google
              </button>

              <button
                onClick={handleGitHubLogin}
                className="group relative overflow-hidden flex items-center justify-center gap-3 rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white shadow-[0_10px_24px_rgba(2,6,23,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(2,6,23,0.65)] hover:bg-black active:translate-y-0 active:scale-[0.985]"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <FaGithub className="h-5 w-5" />
                Continue with GitHub
              </button>

              <div className="my-1 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-xs uppercase tracking-wider text-white/60">or</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>

              <button
                onClick={enterGuest}
                className="group relative overflow-hidden flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-4 py-3 text-sm text-white/90 shadow-[0_8px_20px_rgba(2,6,23,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/18 hover:shadow-[0_16px_34px_rgba(2,6,23,0.38)] active:translate-y-0 active:scale-[0.985]"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                Continue as Guest
                <span className="text-xs opacity-70">(5 GET/day)</span>
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-white/70 md:text-left">
              By logging in, you agree to ReqFlow’s{" "}
              <SafeLink to="/terms" className="underline hover:text-white">
                Terms
              </SafeLink>
              {" & "}
              <SafeLink to="/privacy" className="underline hover:text-white">
                Privacy Policy
              </SafeLink>
            </p>

            <p className="mt-2 text-center text-xs text-white/50 md:text-left">
              <SafeLink to="/about" className="underline hover:text-white">
                About ReqFlow
              </SafeLink>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );

}
