// FILE: frontend/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { useRequests } from "../hooks/useRequests";
import { shallow } from "zustand/shallow";
import {
  buildWorkspaceSessionPayload,
  clearWorkspaceSession,
  isWorkspaceSessionExpired,
  loadWorkspaceSession,
  saveWorkspaceSession,
} from "../utils/workspaceSession";
import { restoreTabsIntoCollections } from "../utils/tabPersistence";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  user: any | null;
  status: AuthStatus;
  loading: boolean;
  hydrated: boolean;
  isGuest: boolean;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isGuest, setIsGuest] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    hasHydratedStorage,
    activeTabCount,
    hasActiveRequest,
    initializeEmptyRequest,
  } = useRequests(
    (state) => ({
      hasHydratedStorage: state.hasHydratedStorage,
      activeTabCount: state.activeTabIds.length,
      hasActiveRequest: Boolean(state.activeRequest),
      initializeEmptyRequest: state.initializeEmptyRequest,
    }),
    shallow
  );

  const getUserId = (candidate: any): string | null =>
    candidate?._id || candidate?.id || null;

  const loading = status === "loading";
  const hydrated = !loading;

  // 🔥 AUTH HYDRATION (single source of truth)
  useEffect(() => {
    let cancelled = false;

    const hydrateAuth = async () => {
      setStatus("loading");

      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (cancelled) return;

        const currentUser = res.data?.user || null;
        if (currentUser) {
          setUser(currentUser);
          setIsGuest(false);
          localStorage.removeItem("guest");
          localStorage.removeItem("guest-get-count");
          setStatus("authenticated");
          return;
        }

        const guestMode = localStorage.getItem("guest") === "true";
        setUser(null);
        setIsGuest(guestMode);
        setStatus(guestMode ? "authenticated" : "unauthenticated");
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status !== 401) {
          console.error("Auth hydration failed:", err);
        }
        const guestMode = localStorage.getItem("guest") === "true";
        setUser(null);
        setIsGuest(guestMode);
        setStatus(guestMode ? "authenticated" : "unauthenticated");
      }
    };

    void hydrateAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    console.info("[AuthContext] boot:init-check", {
      hasHydratedStorage,
      activeTabCount,
      hasActiveRequest,
    });

    if (activeTabCount === 0 && !hasActiveRequest) {
      initializeEmptyRequest();
      console.info("[AuthContext] initializeEmptyRequest triggered");
    }
  }, [
    loading,
    hydrated,
    activeTabCount,
    hasActiveRequest,
    initializeEmptyRequest,
    hasHydratedStorage,
  ]);

  useEffect(() => {
    if (loading || !user) return;
    const userId = getUserId(user);
    if (!userId) return;

    const session = loadWorkspaceSession(userId);
    if (session && !isWorkspaceSessionExpired(session) && session.tabs.length > 0) {
      const requestsByCollection = restoreTabsIntoCollections({
        version: 1,
        activeTabId: session.activeTabId,
        tabs: session.tabs,
      });
      const activeTabIds = session.tabs.map((tab) => tab._id);
      const activeRequest =
        session.tabs.find((tab) => tab._id === session.activeTabId) ||
        session.tabs[0] ||
        null;

      useRequests.setState({
        requestsByCollection,
        activeTabIds,
        activeRequest,
        response: activeRequest?.response ?? null,
      });
      console.info("[AuthContext] workspace restored", {
        userId,
        tabs: activeTabIds.length,
      });
      return;
    }

    if (session && isWorkspaceSessionExpired(session)) {
      clearWorkspaceSession(userId);
      void api.post("/auth/force-logout").catch(() => undefined);
      setUser(null);
      setIsGuest(false);
      useRequests.getState().hardReset();
      return;
    }

    const store = useRequests.getState();
    if (store.activeTabIds.length === 0 && !store.activeRequest) {
      store.initializeEmptyRequest();
    }
  }, [loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    const userId = getUserId(user);
    if (!userId) return;
    let persistTimeout: number | null = null;
    let lastPersistedAt = 0;
    let lastStateKey = "";

    const persistWorkspaceNow = () => {
      const state = useRequests.getState();
      const stateKey = JSON.stringify({
        activeTabIds: state.activeTabIds,
        activeRequestId: state.activeRequest?._id ?? null,
        requestsByCollection: Object.fromEntries(
          Object.entries(state.requestsByCollection || {}).map(([key, list]) => [
            key,
            (list || []).map((request) => request._id),
          ])
        ),
      });
      const now = Date.now();
      if (stateKey === lastStateKey && now - lastPersistedAt < 5000) {
        return;
      }

      const payload = buildWorkspaceSessionPayload({
        userId,
        activeTabIds: state.activeTabIds,
        activeRequest: state.activeRequest,
        requestsByCollection: state.requestsByCollection,
        now,
      });
      saveWorkspaceSession(payload);
      lastPersistedAt = now;
      lastStateKey = stateKey;
    };

    const schedulePersistWorkspace = () => {
      if (persistTimeout !== null) {
        window.clearTimeout(persistTimeout);
      }
      persistTimeout = window.setTimeout(() => {
        persistTimeout = null;
        persistWorkspaceNow();
      }, 250);
    };

    const flushPersistWorkspace = () => {
      if (persistTimeout !== null) {
        window.clearTimeout(persistTimeout);
        persistTimeout = null;
      }
      persistWorkspaceNow();
    };

    persistWorkspaceNow();
    const unsubscribe = useRequests.subscribe(() => {
      schedulePersistWorkspace();
    });
    window.addEventListener("pagehide", flushPersistWorkspace);
    window.addEventListener("beforeunload", flushPersistWorkspace);

    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", flushPersistWorkspace);
      window.removeEventListener("beforeunload", flushPersistWorkspace);
      flushPersistWorkspace();
    };
  }, [loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    const userId = getUserId(user);
    if (!userId) return;

    const interval = window.setInterval(() => {
      const session = loadWorkspaceSession(userId);
      if (!session) return;
      if (!isWorkspaceSessionExpired(session)) return;

      clearWorkspaceSession(userId);
      void api.post("/auth/force-logout").catch(() => undefined);
      setUser(null);
      setIsGuest(false);
      useRequests.getState().hardReset();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loading, user]);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      const wasGuest = isGuest;

      setUser(null);
      setIsGuest(false);
      setStatus("unauthenticated");

      localStorage.removeItem("guest");
      localStorage.removeItem("guest-get-count");
      localStorage.removeItem("reqflow-session");
      const userId = getUserId(user);
      if (userId) {
        clearWorkspaceSession(userId);
      }
      useRequests.getState().hardReset();

      if (!wasGuest) {
        await api.post("/auth/logout").catch(() => { });
      }
    } finally {
      setIsLoggingOut(false);
    }
  };


  return (
    <AuthContext.Provider
      value={{ user, status, loading, hydrated, isGuest, isLoggingOut, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
