import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./components/PrivateRoute";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <>
          {/* Toast notifications (should be outside Routes) */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: "#333", color: "#fff" },
              success: { iconTheme: { primary: "#4ade80", secondary: "#fff" } },
            }}
          />

          {/* App Routes */}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route
              path="/dashboard"
              element={<PrivateRoute element={<Dashboard />} />}
            />
          </Routes>
        </>
      </ThemeProvider>
    </AuthProvider>
  );
}
