import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";
import { normalizeRequestUrl } from "../utils/normalizeRequestUrl";
import { type RequestAuth } from "../utils/requestAuth";
import { resolveRequestTemplates } from "../utils/templateInterpolation";
import {
  createRequestSnapshot,
  isRequestModified,
  type RequestSnapshot,
} from "../utils/savedRequestDiff";
import { type PersistedTabsState } from "../utils/tabPersistence";

// Add this type declaration for ImportMeta.env

/* ---------------- Types ---------------- */
export interface Collection {
  _id: string;
  name: string;
  description?: string;
}

export interface ProxyResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, any>;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface RequestEnvironment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface RequestItem {
  _id: string;
  name: string;
  method: string;
  url: string;
  params?: Record<string, string>;
  auth?: RequestAuth;
  headers: Record<string, string>;
  body?: any;
  response?: any;
  collection?: string | null;
  isTemporary?: boolean;
}

export interface RunAssertionResult {
  assertionId: string;
  name: string;
  passed: boolean;
  message?: string;
}

export interface RunHistoryItem {
  _id: string;
  status: number;
  statusText: string;
  durationMs: number;
  createdAt: string;
  updatedAt: string;
  response?: {
    status: number;
    statusText: string;
    headers?: Record<string, unknown>;
    data?: unknown;
  };
  assertionResults?: RunAssertionResult[];
}

export interface RequestHistoryState {
  items: RunHistoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
  loading: boolean;
  loaded: boolean;
  error?: string | null;
}

interface ReqFlowState {
  collections: Collection[];
  requestsByCollection: Record<string, RequestItem[]>;
  activeTabIds: string[];
  activeRequest?: RequestItem | null;
  response?: any;
  loading: boolean;
  activeCollection: string | null;
  environments: RequestEnvironment[];
  activeEnvironmentId: string | null;
  // Core functions
  fetchCollections: () => Promise<void>;
  fetchRequests: (collectionId: string) => Promise<void>;
  createCollection: (name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  openRequest: (request: RequestItem) => void;
  closeTab: (id: string) => void;
  executeRequest: (id: string) => Promise<void>;
  setResponse: (response: any) => void;
  setLoading: (loading: boolean) => void;
  setActiveCollection: (id: string | null) => void;
  setActiveEnvironment: (id: string) => void;
  createEnvironment: (name?: string) => void;
  renameEnvironment: (id: string, name: string) => void;
  deleteEnvironment: (id: string) => void;
  upsertEnvironmentVariable: (
    envId: string,
    variable: EnvironmentVariable
  ) => void;
  deleteEnvironmentVariable: (envId: string, variableId: string) => void;
  getActiveEnvironmentVariableMap: () => Record<string, string>;
  createRequest: (collectionId?: string) => void;
  updateRequest: (id: string, updates: Partial<RequestItem>) => void;
  saveRequest: (id: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  createTemporaryRequest: () => void;
  initializeEmptyRequest: () => void;
  hardReset: () => void;
  setGuestInitialized: () => void;
  guestInitialized: boolean;
  guestRemaining: number | null;
  setGuestRemaining: (n: number) => void;
  savedRequestSnapshots: Record<string, RequestSnapshot>;
  isActiveSavedRequestModified: () => boolean;
  executeUnsavedActiveRequest: () => Promise<void>;
  persistedTabs: PersistedTabsState;
  hasHydratedStorage: boolean;
  executionHistoryByRequest: Record<string, RequestHistoryState>;
  fetchExecutionHistory: (
    requestId: string,
    options?: { reset?: boolean }
  ) => Promise<void>;
  loadMoreExecutionHistory: (requestId: string) => Promise<void>;
}

const createDefaultEnvironment = (): RequestEnvironment => ({
  id: crypto.randomUUID(),
  name: "Development",
  variables: [],
});

const createDefaultHistoryState = (): RequestHistoryState => ({
  items: [],
  nextCursor: null,
  hasMore: true,
  loading: false,
  loaded: false,
  error: null,
});

const resolveExecutionPayload = (
  request: RequestItem,
  interpolationVariables: Record<string, string>
) => {
  const resolved = resolveRequestTemplates(
    {
      url: request.url || "",
      params: request.params || {},
      headers: request.headers || {},
      body: request.body,
      auth: request.auth || { type: "none" },
    },
    interpolationVariables
  );

  return {
    resolvedUrl: normalizeRequestUrl(resolved.url || ""),
    resolvedParams: (resolved.params || {}) as Record<string, string>,
    resolvedHeaders: (resolved.headers || {}) as Record<string, string>,
    resolvedBody: resolved.body,
    resolvedAuth: (resolved.auth || { type: "none" }) as RequestAuth,
  };
};

const resolveDisplayedLatencyMs = (
  payload: unknown,
  startedAtMs: number
): number => {
  const latencyMs =
    payload && typeof payload === "object" && "latencyMs" in payload
      ? Number((payload as any).latencyMs)
      : NaN;

  if (Number.isFinite(latencyMs) && latencyMs >= 0) {
    return Math.round(latencyMs);
  }

  return Math.max(0, Math.round(performance.now() - startedAtMs));
};

/* ---------------- Store ---------------- */
export const useRequests = create<ReqFlowState>()(

  persist(
    (set, get) => {
      const defaultEnvironment = createDefaultEnvironment();

      return {
      collections: [],
      requestsByCollection: {},
      activeTabIds: [],
      activeRequest: null,
      activeCollection: null,
      environments: [defaultEnvironment],
      activeEnvironmentId: defaultEnvironment.id,
      response: null,
      loading: false,
      setLoading: (loading) => set({ loading }),
      setResponse: (response) => set({ response }),
      setActiveCollection: (id) => set({ activeCollection: id }),
      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),
      createEnvironment: (name = "New Environment") =>
        set((state) => {
          const created = {
            id: crypto.randomUUID(),
            name: name.trim() || "New Environment",
            variables: [],
          };
          return {
            environments: [...state.environments, created],
            activeEnvironmentId: created.id,
          };
        }),
      renameEnvironment: (id, name) =>
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === id ? { ...env, name: name.trim() || env.name } : env
          ),
        })),
      deleteEnvironment: (id) =>
        set((state) => {
          const nextEnvironments = state.environments.filter((env) => env.id !== id);
          if (nextEnvironments.length === 0) {
            const fallback = createDefaultEnvironment();
            return {
              environments: [fallback],
              activeEnvironmentId: fallback.id,
            };
          }
          const nextActive =
            state.activeEnvironmentId === id
              ? nextEnvironments[0].id
              : state.activeEnvironmentId;
          return {
            environments: nextEnvironments,
            activeEnvironmentId: nextActive,
          };
        }),
      upsertEnvironmentVariable: (envId, variable) =>
        set((state) => ({
          environments: state.environments.map((env) => {
            if (env.id !== envId) return env;
            const exists = env.variables.some((entry) => entry.id === variable.id);
            if (exists) {
              return {
                ...env,
                variables: env.variables.map((entry) =>
                  entry.id === variable.id ? variable : entry
                ),
              };
            }
            return {
              ...env,
              variables: [...env.variables, variable],
            };
          }),
        })),
      deleteEnvironmentVariable: (envId, variableId) =>
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === envId
              ? {
                  ...env,
                  variables: env.variables.filter((entry) => entry.id !== variableId),
                }
              : env
          ),
        })),
      getActiveEnvironmentVariableMap: () => {
        const { environments, activeEnvironmentId } = get();
        const active =
          environments.find((env) => env.id === activeEnvironmentId) ||
          environments[0] ||
          null;
        if (!active) return {};

        const next: Record<string, string> = {};
        for (const variable of active.variables || []) {
          const key = (variable.key || "").trim();
          if (!key) continue;
          next[key] = variable.value || "";
        }
        return next;
      },
      guestRemaining: null,
      savedRequestSnapshots: {},
      persistedTabs: {
        version: 1,
        activeTabId: null,
        tabs: [],
      },
      hasHydratedStorage: false,
      executionHistoryByRequest: {},
      setGuestRemaining: (n) => set({ guestRemaining: n }),
      initializeGuest: () => {
        const { guestInitialized } = get();
        if (guestInitialized) return;

        const tempId = crypto.randomUUID();

        const temp: RequestItem = {
          _id: tempId,
          name: "New Request",
          method: "GET",
          url: "",
          params: {},
          auth: { type: "none" },
          headers: {},
          body: {},
          isTemporary: true,
          collection: null,
          response: null,
        };

        set({
          guestInitialized: true,
          collections: [],
          requestsByCollection: { __temp__: [temp] },
          activeTabIds: [tempId],
          activeRequest: temp,
          response: null,
          activeCollection: null,
        });
      },
      guestInitialized: false,

      setGuestInitialized: () => {
        const { guestInitialized, activeTabIds } = get();
        if (guestInitialized || activeTabIds.length > 0) return;

        const tempId = crypto.randomUUID();

        const temp: RequestItem = {
          _id: tempId,
          name: "New Request",
          method: "GET",
          url: "",
          params: {},
          auth: { type: "none" },
          headers: {},
          body: {},
          isTemporary: true,
          collection: null,
          response: null,
        };

        set({
          guestInitialized: true,
          collections: [],
          requestsByCollection: { __temp__: [temp] },
          activeTabIds: [tempId],
          activeRequest: temp,
          response: null,
          activeCollection: null,
        });
      },


      /* -------- Collections -------- */

      fetchCollections: async () => {
        try {
          const res = await api.get("/collections"); // ✅ cookies auto sent
          set({ collections: res.data });
        } catch (err) {
          console.error("Fetch collections failed", err);
        }
      },




      /* -------- Requests -------- */
      fetchRequests: async (collectionId) => {
        try {
          const res = await api.get<RequestItem[]>(
            `/requests/collection/${collectionId}`
          );

          const requestsWithDefaults = res.data.map((r) => ({
            ...r,
            method: r.method || "GET",
            params: r.params || {},
            auth: r.auth || { type: "none" },
            headers: r.headers || {},
            body: r.body || {},
            isTemporary: false,
            response: null,
          }));

          set((state) => ({
            requestsByCollection: {
              ...state.requestsByCollection,
              [collectionId]: requestsWithDefaults,
            },
            savedRequestSnapshots: {
              ...state.savedRequestSnapshots,
              ...Object.fromEntries(
                requestsWithDefaults
                  .filter((request) => !request.isTemporary)
                  .map((request) => [request._id, createRequestSnapshot(request)])
              ),
            },
          }));
        } catch (err) {
          console.error("Fetch requests failed", err);
        }
      },

      fetchExecutionHistory: async (requestId, options = {}) => {
        if (!requestId) return;
        const reset = options.reset ?? true;
        const current = get().executionHistoryByRequest[requestId];
        if (current?.loading) return;
        if (!reset && current && !current.hasMore) return;

        const beforeCursor =
          !reset && current?.nextCursor ? current.nextCursor : undefined;

        set((state) => ({
          executionHistoryByRequest: {
            ...state.executionHistoryByRequest,
            [requestId]: {
              ...(reset ? createDefaultHistoryState() : current || createDefaultHistoryState()),
              items: reset ? [] : current?.items || [],
              loading: true,
              error: null,
            },
          },
        }));

        try {
          const params: Record<string, string | number> = { limit: 20 };
          if (beforeCursor) {
            params.before = beforeCursor;
          }

          const res = await api.get(`/requests/${requestId}/history`, { params });
          const incomingItems = Array.isArray(res.data?.items)
            ? (res.data.items as RunHistoryItem[])
            : [];
          const hasMore = Boolean(res.data?.page?.hasMore);
          const nextCursor =
            typeof res.data?.page?.nextCursor === "string" &&
            res.data.page.nextCursor.length > 0
              ? res.data.page.nextCursor
              : null;

          set((state) => {
            const previous = state.executionHistoryByRequest[requestId]?.items || [];
            const merged = reset
              ? incomingItems
              : [
                  ...previous,
                  ...incomingItems.filter(
                    (item) => !previous.some((existing) => existing._id === item._id)
                  ),
                ];

            return {
              executionHistoryByRequest: {
                ...state.executionHistoryByRequest,
                [requestId]: {
                  items: merged,
                  hasMore,
                  nextCursor,
                  loading: false,
                  loaded: true,
                  error: null,
                },
              },
            };
          });
        } catch (err: any) {
          const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch execution history";
          set((state) => ({
            executionHistoryByRequest: {
              ...state.executionHistoryByRequest,
              [requestId]: {
                ...(state.executionHistoryByRequest[requestId] ||
                  createDefaultHistoryState()),
                loading: false,
                loaded: true,
                error: msg,
              },
            },
          }));
        }
      },

      loadMoreExecutionHistory: async (requestId) => {
        await get().fetchExecutionHistory(requestId, { reset: false });
      },

      hardReset: () => {
        const fallbackEnvironment = createDefaultEnvironment();
        sessionStorage.removeItem("reqflow-session"); // 🔥 KILL persisted data
        set({
          collections: [],
          requestsByCollection: {},
          activeTabIds: [],
          activeRequest: null,
          response: null,
          activeCollection: null,
          environments: [fallbackEnvironment],
          activeEnvironmentId: fallbackEnvironment.id,
          loading: false,
          savedRequestSnapshots: {},
          executionHistoryByRequest: {},
          persistedTabs: {
            version: 1,
            activeTabId: null,
            tabs: [],
          },
        });
      },

      createCollection: async (name) => {
        try {
          await api.post("/collections", { name }); // ✅ cookie auth
          await get().fetchCollections();           // ✅ refresh UI
        } catch (err) {
          console.error("Create collection failed", err);
        }
      },


      deleteCollection: async (id) => {
        try {
          const token =
            sessionStorage.getItem("accessToken") ||
            localStorage.getItem("accessToken");
          await api.delete(`/collections/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set((state) => {
            const updated = { ...state.requestsByCollection };
            delete updated[id];
            return { requestsByCollection: updated };
          });
          await get().fetchCollections();
        } catch (err) {
          console.error("Delete collection failed", err);
        }
      },

      /* -------- Tabs -------- */
      closeTab: (id) => {
        const { activeTabIds, activeRequest, requestsByCollection } = get();

        const index = activeTabIds.indexOf(id);
        if (index === -1) return;

        const updatedTabs = activeTabIds.filter((tid) => tid !== id);

        // If the closed tab was NOT active → just remove it
        if (activeRequest?._id !== id) {
          set({ activeTabIds: updatedTabs });
          return;
        }

        // Decide which tab becomes active:
        // prefer previous, otherwise next
        let nextTabId: string | null = null;

        if (updatedTabs.length > 0) {
          if (index - 1 >= 0) {
            nextTabId = updatedTabs[index - 1];
          } else {
            nextTabId = updatedTabs[0];
          }
        }

        // Resolve request object without flattening all collections (lower alloc cost).
        let nextRequest = null;
        if (nextTabId) {
          for (const list of Object.values(requestsByCollection || {})) {
            const found = list.find((request) => request._id === nextTabId);
            if (found) {
              nextRequest = found;
              break;
            }
          }
          if (!nextRequest && activeRequest?._id === nextTabId) {
            nextRequest = activeRequest;
          }
        }

        set({
          activeTabIds: updatedTabs,
          activeRequest: nextRequest,
          response: nextRequest?.response ?? null,
        });
      },


      createTemporaryRequest: () => {
        const tempId = crypto.randomUUID();

        const temp: RequestItem = {
          _id: tempId,
          name: "New Request",
          method: "GET",
          url: "",
          params: {},
          auth: { type: "none" },
          headers: {},
          body: {},
          isTemporary: true,
          collection: null,
          response: null,
        };

        set((state) => ({
          activeRequest: temp,
          activeTabIds: [...state.activeTabIds, tempId],
          requestsByCollection: {
            ...state.requestsByCollection,
            __temp__: [...(state.requestsByCollection.__temp__ || []), temp],
          },
          response: null,
        }));
      },




      createRequest: (collectionId) => {
        const { activeCollection } = get();
        if (!collectionId && !activeCollection) {
          return;
        }

        const newRequest: RequestItem = {
          _id: crypto.randomUUID(),
          name: "New Request",
          method: "GET",
          url: "",
          params: {},
          auth: { type: "none" },
          headers: {},
          body: {},
          isTemporary: true,
          collection: collectionId ?? activeCollection,
          response: null,
        };

        set((state) => ({
          requestsByCollection: {
            ...state.requestsByCollection,
            [newRequest.collection!]: [
              ...(state.requestsByCollection[newRequest.collection!] || []),
              newRequest,
            ],
          },
          activeTabIds: [...state.activeTabIds, newRequest._id],
          activeRequest: newRequest,
          response: null,
        }));
      },


      openRequest: (request) => {
        set((state) => ({
          activeTabIds: state.activeTabIds.includes(request._id)
            ? state.activeTabIds
            : [...state.activeTabIds, request._id],
          activeRequest: request,
          response: request.response ?? null,
        }));
      },

      initializeEmptyRequest: () => {
        const { activeTabIds } = get();
        if (activeTabIds.length > 0) return;

        const tempId = crypto.randomUUID();

        const temp: RequestItem = {
          _id: tempId,
          name: "New Request",
          method: "GET",
          url: "",
          params: {},
          auth: { type: "none" },
          headers: {},
          body: {},
          isTemporary: true,
          collection: null,
          response: null,
        };

        set({
          requestsByCollection: { __temp__: [temp] },
          activeTabIds: [tempId],
          activeRequest: temp,
          response: null,
          activeCollection: null,
          persistedTabs: {
            version: 1,
            activeTabId: tempId,
            tabs: [temp],
          },
        });
      },

      updateRequest: (id, updates) => {
        set((state) => {
          const updated = { ...state.requestsByCollection };
          let found = false;

          const preferredCollectionIds = [
            state.activeRequest?.collection ?? "__temp__",
            "__temp__",
          ].filter((value, index, arr): value is string =>
            Boolean(value) && arr.indexOf(value) === index
          );

          for (const colId of preferredCollectionIds) {
            const list = updated[colId];
            if (!list) continue;

            const idx = list.findIndex((request) => request._id === id);
            if (idx === -1) continue;

            const nextList = [...list];
            nextList[idx] = { ...nextList[idx], ...updates };
            updated[colId] = nextList;
            found = true;
            break;
          }

          if (!found) {
            for (const [colId, list] of Object.entries(updated)) {
              const idx = list.findIndex((request) => request._id === id);
              if (idx === -1) continue;

              const nextList = [...list];
              nextList[idx] = { ...nextList[idx], ...updates };
              updated[colId] = nextList;
              found = true;
              break;
            }
          }

          return {
            requestsByCollection: updated,
            activeRequest:
              state.activeRequest && state.activeRequest._id === id
                ? { ...state.activeRequest, ...updates }
                : state.activeRequest,
          };
        });
      },

      /* -------- Execute -------- */
      executeRequest: async (id) => {
      const { guestRemaining } = get();

if (guestRemaining !== null && guestRemaining <= 0) {
  throw new Error("Guest request limit exhausted");
}


const {
  activeRequest,
  updateRequest,
  setResponse,
  setLoading,
  setGuestRemaining,
  fetchExecutionHistory,
  getActiveEnvironmentVariableMap,
} = get();

        if (!activeRequest) {
          console.error("No active request to execute");
          return;
        }

        setLoading(true);
        const start = performance.now();
        const interpolationVariables = getActiveEnvironmentVariableMap();

        try {
          // ---------------- TEMP REQUEST ----------------
          if (activeRequest.isTemporary) {
            console.log("🌐 Executing TEMP request...");
            const {
              resolvedUrl,
              resolvedParams,
              resolvedHeaders,
              resolvedBody,
              resolvedAuth,
            } = resolveExecutionPayload(activeRequest, interpolationVariables);
		  
            const res = await api.post(
  "/requests/proxy",
  {
    url: resolvedUrl,
    method: activeRequest.method,
    params: resolvedParams,
    auth: resolvedAuth,
    headers: resolvedHeaders,
    body: resolvedBody,
    environmentVariables: interpolationVariables,
  },
  { withCredentials: true }
);

// ❌ treat HTTP error as failure
if (res.status >= 400) {
  throw {
    response: res,
  };
}

const remaining = res.headers["x-guest-remaining"];
if (remaining !== undefined) {
  setGuestRemaining(Number(remaining));
}

const enhancedResponse = {
  data: res.data?.data ?? res.data,
  status: res.status,
  statusText: res.statusText,
  headers: res.data?.headers ?? {},
  time: resolveDisplayedLatencyMs(res.data, start),
};

	
            updateRequest(activeRequest._id, {
              response: enhancedResponse,
            });
            set({ response: enhancedResponse });

          }
          // ---------------- SAVED REQUEST ----------------
          else {
            console.log("💾 Executing SAVED request...");

            const res = await api.post(
  `/requests/${activeRequest._id}/execute`,
  { environmentVariables: interpolationVariables },
  { withCredentials: true }
);

if (res.status >= 400) {
  const remaining = res.headers["x-guest-remaining"];
  if (remaining !== undefined) {
    setGuestRemaining(Number(remaining));
  }

  throw {
    response: res,
  };
}



            const enhancedResponse = {
              ...res.data,
              time: resolveDisplayedLatencyMs(res.data, start),
            };

            updateRequest(activeRequest._id, { response: enhancedResponse });
            set({
              activeRequest: {
                ...activeRequest,
                response: enhancedResponse,
              },
              response: enhancedResponse,
            });

            setTimeout(() => {
              void fetchExecutionHistory(activeRequest._id, { reset: true });
            }, 250);
          }

        } catch (err: any) {
  if (err.response) {
    const remaining = err.response.headers?.["x-guest-remaining"];
    if (remaining !== undefined) {
      setGuestRemaining(Number(remaining));
    }

    const enhancedResponse = {
      data: err.response.data,
      status: err.response.status,
      statusText: err.response.statusText,
      headers: err.response.headers ?? {},
      time: resolveDisplayedLatencyMs(err.response.data, start),
    };

    updateRequest(activeRequest._id, { response: enhancedResponse });
    set({ response: enhancedResponse });

    // 🔥 IMPORTANT
    throw new Error(
      err.response.data?.message ||
      err.response.data?.error ||
      "Request failed"
    );
  }

  throw new Error(err.message || "Request failed");
}
 finally {
          setLoading(false);
        }
      },

      executeUnsavedActiveRequest: async () => {
        const { guestRemaining } = get();
        if (guestRemaining !== null && guestRemaining <= 0) {
          throw new Error("Guest request limit exhausted");
        }

        const {
          activeRequest,
          updateRequest,
          setLoading,
          setGuestRemaining,
          getActiveEnvironmentVariableMap,
        } = get();
        if (!activeRequest) {
          throw new Error("No active request to execute");
        }

        setLoading(true);
        const start = performance.now();
        const interpolationVariables = getActiveEnvironmentVariableMap();
        const {
          resolvedUrl,
          resolvedParams,
          resolvedHeaders,
          resolvedBody,
          resolvedAuth,
        } = resolveExecutionPayload(activeRequest, interpolationVariables);

        try {
          const res = await api.post(
            "/requests/proxy",
            {
              url: resolvedUrl,
              method: activeRequest.method,
              params: resolvedParams,
              auth: resolvedAuth,
              headers: resolvedHeaders,
              body: resolvedBody,
              environmentVariables: interpolationVariables,
            },
            { withCredentials: true }
          );

          if (res.status >= 400) {
            throw { response: res };
          }

          const remaining = res.headers["x-guest-remaining"];
          if (remaining !== undefined) {
            setGuestRemaining(Number(remaining));
          }

          const enhancedResponse = {
            data: res.data?.data ?? res.data,
            status: res.status,
            statusText: res.statusText,
            headers: res.data?.headers ?? {},
            time: resolveDisplayedLatencyMs(res.data, start),
          };

          updateRequest(activeRequest._id, {
            response: enhancedResponse,
          });
          set({ response: enhancedResponse });
        } catch (err: any) {
          if (err.response) {
            const remaining = err.response.headers?.["x-guest-remaining"];
            if (remaining !== undefined) {
              setGuestRemaining(Number(remaining));
            }

            const enhancedResponse = {
              data: err.response.data,
              status: err.response.status,
              statusText: err.response.statusText,
              headers: err.response.headers ?? {},
              time: resolveDisplayedLatencyMs(err.response.data, start),
            };

            updateRequest(activeRequest._id, { response: enhancedResponse });
            set({ response: enhancedResponse });

            throw new Error(
              err.response.data?.message ||
                err.response.data?.error ||
                "Request failed"
            );
          }

          throw new Error(err.message || "Request failed");
        } finally {
          setLoading(false);
        }
      },

      isActiveSavedRequestModified: () => {
        const { activeRequest, savedRequestSnapshots } = get();
        if (!activeRequest || activeRequest.isTemporary) return false;
        const snapshot = savedRequestSnapshots[activeRequest._id];
        return isRequestModified(snapshot, activeRequest);
      },


      /* -------- Save / Delete -------- */
      saveRequest: async (id) => {
        const { activeRequest, fetchRequests } = get();
        if (!activeRequest) return;

        try {
          if (activeRequest.isTemporary) {
            const { response, isTemporary, ...cleanReq } = activeRequest;
            const payload = {
              ...cleanReq,
              url: normalizeRequestUrl(cleanReq.url),
            };

            const res = await api.post<RequestItem>("/requests", payload);

            get().updateRequest(activeRequest._id, {
              ...res.data,
              isTemporary: false,
            });
            set((state) => ({
              savedRequestSnapshots: {
                ...state.savedRequestSnapshots,
                [res.data._id]: createRequestSnapshot(res.data),
              },
            }));

            if (!payload.collection?.trim()) {
              throw new Error("Request not saved. Please select a collection.");
            }

            await fetchRequests(payload.collection);
          } else {
            const { response, ...cleanReq } = activeRequest;
            const payload = {
              ...cleanReq,
              url: normalizeRequestUrl(cleanReq.url),
            };

            await api.put(`/requests/${id}`, payload);
            set((state) => ({
              savedRequestSnapshots: {
                ...state.savedRequestSnapshots,
                [id]: createRequestSnapshot(payload),
              },
            }));

            if (!payload.collection?.trim()) {
              throw new Error("Request not saved. Please select a collection.");
            }

            await fetchRequests(payload.collection);
          }
        } catch (err: any) {
          const msg =
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Unknown error";

          console.error("Save request failed:", msg);
          throw new Error(msg);
        }
      },


      deleteRequest: async (id) => {
        const { activeRequest, fetchRequests } = get();
        if (!activeRequest) return;

        const token =
          sessionStorage.getItem("accessToken") ||
          localStorage.getItem("accessToken");

        try {
          if (!activeRequest.isTemporary) {
            await api.delete(`/requests/${id}`);
          }


          if (activeRequest.collection) {
            await fetchRequests(activeRequest.collection);
          }

          // 🔥 FIX: remove tab + clear active request
          set((state) => ({
            activeTabIds: state.activeTabIds.filter(
              (tid) => tid !== activeRequest._id
            ),
            activeRequest: null,
            response: null,
            executionHistoryByRequest: Object.fromEntries(
              Object.entries(state.executionHistoryByRequest || {}).filter(
                ([requestKey]) => requestKey !== activeRequest._id
              )
            ),
          }));
        } catch (err: any) {
          console.error("Delete request failed:", err.response?.data || err.message);
        }
      },
      reset: () =>
        set(() => {
          const fallbackEnvironment = createDefaultEnvironment();
          return {
          collections: [],
          requestsByCollection: {},
          activeTabIds: [],
          activeRequest: null,
          response: null,
          activeCollection: null,
          environments: [fallbackEnvironment],
          activeEnvironmentId: fallbackEnvironment.id,
          loading: false,
          savedRequestSnapshots: {},
          executionHistoryByRequest: {},
          persistedTabs: {
            version: 1,
            activeTabId: null,
            tabs: [],
          },
          };
        }),
      };
    },
    {
      name: "reqflow-session",
      getStorage: () => localStorage,
      partialize: (state) => ({
        activeCollection: state.activeCollection,
        environments: state.environments,
        activeEnvironmentId: state.activeEnvironmentId,
        guestInitialized: state.guestInitialized,
      }),
      onRehydrateStorage: () => () => {
        const state = useRequests.getState();
        if (!state.environments || state.environments.length === 0) {
          const fallbackEnvironment = createDefaultEnvironment();
          useRequests.setState({
            environments: [fallbackEnvironment],
            activeEnvironmentId: fallbackEnvironment.id,
          });
        } else if (!state.activeEnvironmentId) {
          useRequests.setState({ activeEnvironmentId: state.environments[0].id });
        }
        useRequests.setState({ hasHydratedStorage: true });
        console.info("[useRequests] persist rehydrate complete");
      },

    }
  )
);
