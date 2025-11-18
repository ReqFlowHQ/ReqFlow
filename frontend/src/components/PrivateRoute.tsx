import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ element }: { element: JSX.Element }) {
  const { token, loading } = useAuth();

  if (loading) return <p className="text-center text-gray-300 mt-10">Loading...</p>;

  return token ? element : <Navigate to="/login" replace />;
}
