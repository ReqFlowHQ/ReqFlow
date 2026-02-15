import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

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

export interface RequestItem {
  _id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  response?: any;
  collection?: string | null;
  isTemporary?: boolean;
}

interface ReqFlowState {
  collections: Collection[];
  requestsByCollection: Record<string, RequestItem[]>;
  activeTabIds: string[];
  activeRequest?: RequestItem | null;
  response?: any;
  loading: boolean;
  activeCollection: string | null;
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
}

/* ---------------- Store ---------------- */
export const useRequests = create<ReqFlowState>()(

  persist(
    (set, get) => ({
      collections: [],
      requestsByCollection: {},
      activeTabIds: [],
      activeRequest: null,
      activeCollection: null,
      response: null,
      loading: false,
      setLoading: (loading) => set({ loading }),
      setResponse: (response) => set({ response }),
      setActiveCollection: (id) => set({ activeCollection: id }),
      guestRemaining: null,
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
        const { guestInitialized } = get();
        if (guestInitialized) return;

        const tempId = crypto.randomUUID();

        const temp: RequestItem = {
          _id: tempId,
          name: "New Request",
          method: "GET",
          url: "",
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
          }));
        } catch (err) {
          console.error("Fetch requests failed", err);
        }
      },

      hardReset: () => {
        sessionStorage.removeItem("reqflow-session"); // 🔥 KILL persisted data
        set({
          collections: [],
          requestsByCollection: {},
          activeTabIds: [],
          activeRequest: null,
          response: null,
          activeCollection: null,
          loading: false,
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

        // Resolve request object
        const allRequests = [
          ...Object.values(requestsByCollection || {}).flat(),
          ...(activeRequest ? [activeRequest] : []),
        ];

        const nextRequest = nextTabId
          ? allRequests.find((r) => r._id === nextTabId) || null
          : null;

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
        const tempId = crypto.randomUUID();

        const temp: RequestItem = {
          _id: tempId,
          name: "New Request",
          method: "GET",
          url: "",
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
} = get();

        if (!activeRequest) {
          console.error("No active request to execute");
          return;
        }

        setLoading(true);
        const start = performance.now();

        try {
          // ---------------- TEMP REQUEST ----------------
          if (activeRequest.isTemporary) {
            console.log("🌐 Executing TEMP request...");
	  
            const res = await api.post(
  "/requests/proxy",
  {
    url: activeRequest.url,
    method: activeRequest.method,
    headers: activeRequest.headers,
    body: activeRequest.body,
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
  time: Math.round(performance.now() - start),
};


            updateRequest(activeRequest._id, { response: enhancedResponse });
            set({ response: enhancedResponse });

          }
          // ---------------- SAVED REQUEST ----------------
          else {
            console.log("💾 Executing SAVED request...");

            const res = await api.post(
  `/requests/${activeRequest._id}/execute`,
  {},
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
              time: Math.round(performance.now() - start),
            };

            updateRequest(activeRequest._id, { response: enhancedResponse });
            set({
              activeRequest: {
                ...activeRequest,
                response: enhancedResponse,
              },
              response: enhancedResponse,
            });
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
      time: Math.round(performance.now() - start),
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


      /* -------- Save / Delete -------- */
      saveRequest: async (id) => {
        const { activeRequest, fetchRequests } = get();
        if (!activeRequest) return;

        try {
          if (activeRequest.isTemporary) {
            const { response, isTemporary, ...cleanReq } = activeRequest;

            const res = await api.post<RequestItem>("/requests", cleanReq);

            get().updateRequest(activeRequest._id, {
              ...res.data,
              isTemporary: false,
            });

            if (!cleanReq.collection?.trim()) {
              throw new Error("Request not saved. Please select a collection.");
            }

            await fetchRequests(cleanReq.collection);
          } else {
            const { response, ...cleanReq } = activeRequest;

            await api.put(`/requests/${id}`, cleanReq);

            if (!cleanReq.collection?.trim()) {
              throw new Error("Request not saved. Please select a collection.");
            }

            await fetchRequests(cleanReq.collection);
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
          }));
        } catch (err: any) {
          console.error("Delete request failed:", err.response?.data || err.message);
        }
      },
      reset: () =>
        set({
          collections: [],
          requestsByCollection: {},
          activeTabIds: [],
          activeRequest: null,
          response: null,
          activeCollection: null,
          loading: false,
        }),




    }),
    {
      name: "reqflow-session",
      getStorage: () => sessionStorage,
      partialize: (state) => ({
        collections: state.collections,
        requestsByCollection: state.requestsByCollection,
        activeTabIds: state.activeTabIds,
        activeCollection: state.activeCollection,
        guestInitialized: state.guestInitialized,
      }),

    }
  )
);
