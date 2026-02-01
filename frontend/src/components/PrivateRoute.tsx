import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ element }: { element: JSX.Element }) {
  const { user, isGuest, hydrated, isLoggingOut } = useAuth();

  // ⛔ Block routing during logout
  if (!hydrated || isLoggingOut) return null;

  if (user || isGuest) {
    return element;
  }

  return <Navigate to="/login" replace />;
}

