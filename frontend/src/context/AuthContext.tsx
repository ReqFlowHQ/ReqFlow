// FILE: frontend/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface AuthContextType {
  user: any;
  loading: boolean;
  isGuest: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Auth hydration (cookie-based)
  useEffect(() => {
    api
      .get("/auth/me", { withCredentials: true })
      .then((res) => {
        setUser(res.data.user);
        sessionStorage.removeItem("guest"); // real login overrides guest
        sessionStorage.removeItem("guest-get-count");
      })
      .catch(() => {
        // Not logged in → stay null
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = () => {
    navigate("/dashboard");
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
    sessionStorage.removeItem("guest");
    sessionStorage.removeItem("guest-get-count");
    sessionStorage.removeItem("reqflow-session");
    navigate("/login");
  };

  const isGuest =
    !loading &&
    !user &&
    sessionStorage.getItem("guest") === "true";

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
