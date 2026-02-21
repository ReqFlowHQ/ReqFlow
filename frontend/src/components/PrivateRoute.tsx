import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ element }: { element: JSX.Element }) {
  const { status, isGuest, isLoggingOut } = useAuth();

  if (status === "loading" || isLoggingOut) return null;

  if (status === "unauthenticated" && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return element;
}
