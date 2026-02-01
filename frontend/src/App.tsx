import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import ScrollToTop from "./components/ScrollToTop";
import AppLoader from "./components/AppLoader";

// Lazy pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

const MAINTENANCE =
  import.meta.env.VITE_MAINTENANCE_MODE === "true";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "#111", color: "#fff" },
            success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          }}
        />

        <ScrollToTop />

        {/* 🚀 Landing: instant, NO loader on refresh */}
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Landing />} />
          </Routes>
        </Suspense>

        {/* 🧠 Everything else: shows loader while loading */}
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            <Route
              path="/login"
              element={MAINTENANCE ? <Maintenance /> : <Login />}
            />
            <Route
              path="/verify/:token"
              element={MAINTENANCE ? <Maintenance /> : <VerifyEmail />}
            />

            <Route
              path="/dashboard"
              element={
                MAINTENANCE
                  ? <Maintenance />
                  : <PrivateRoute element={<Dashboard />} />
              }
            />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </AuthProvider>
  );
}

