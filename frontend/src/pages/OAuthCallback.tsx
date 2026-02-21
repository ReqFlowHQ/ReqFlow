import { Navigate } from "react-router-dom";
import AppLoader from "../components/AppLoader";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const { status, user, isGuest } = useAuth();

  if (status === "loading") {
    return <AppLoader />;
  }

  if (status === "authenticated" && (user || isGuest)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}
