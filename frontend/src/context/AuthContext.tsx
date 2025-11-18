// FILE: frontend/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: (token: string, userData?: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
  const storedToken = sessionStorage.getItem("accessToken");
  const storedUser = sessionStorage.getItem("user");

  if (storedToken) {
    setToken(storedToken);
  }
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }

  setLoading(false);
}, []);



  const login = (newToken: string, userData?: any) => {
    setToken(newToken);
    setUser(userData);
    sessionStorage.setItem("accessToken", newToken);
    if (userData) sessionStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
  setToken(null);
  setUser(null);
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("user");
  navigate("/login");
};


  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);