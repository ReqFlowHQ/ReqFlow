// FILE: frontend/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { useRequests } from "../hooks/useRequests";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  hydrated: boolean;
  isGuest: boolean;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      useRequests.getState().hardReset();
    }
  }, [user, loading]);

  // 🔥 AUTH HYDRATION (single source of truth)
  useEffect(() => {
    api
      .get("/auth/me", { withCredentials: true })
      .then((res) => {
  const user = res.data.user;

  if (user) {
    // real logged-in user
    setUser(user);
    setIsGuest(false);
    localStorage.removeItem("guest");
    localStorage.removeItem("guest-get-count");
  } else {
    // unauthenticated but valid response
    setUser(null);
    setIsGuest(localStorage.getItem("guest") === "true");
  }
})

      .catch((err) => {
  if (err?.response?.status !== 401) {
    console.error("Auth hydration failed:", err);
  }

  // 401 = not logged in → normal state
  setUser(null);
  setIsGuest(localStorage.getItem("guest") === "true");
})

      .finally(() => {
        setLoading(false);
        setHydrated(true); // 🔥 THIS IS THE KEY
      });
  }, []);

  useEffect(() => {
    if (!loading) {
      const store = useRequests.getState();

      if (!store.activeRequest) {
        store.initializeEmptyRequest();
      }
    }
  }, [loading]);

  const logout = async () => {
    setIsLoggingOut(true);        // 🔥 KEY LINE

    const wasGuest = isGuest;

    setUser(null);
    setIsGuest(false);

    localStorage.removeItem("guest");
    localStorage.removeItem("guest-get-count");
    localStorage.removeItem("reqflow-session");

    if (!wasGuest) {
      await api.post("/auth/logout").catch(() => { });
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, hydrated, isGuest, isLoggingOut,logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
