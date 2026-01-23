// FILE: frontend/src/components/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ element }: { element: JSX.Element }) {
  const { user, loading } = useAuth();

  const isGuest = sessionStorage.getItem("guest") === "true";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  // ✅ Logged-in OR guest
  if (user || isGuest) {
    return element;
  }

  // ❌ Truly unauthenticated
  return <Navigate to="/login" replace />;
}

