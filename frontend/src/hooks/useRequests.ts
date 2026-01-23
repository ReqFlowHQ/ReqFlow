import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";
import axios, { type AxiosResponse } from "axios";

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

      /* -------- Collections -------- */
      
      fetchCollections: async () => {
        try {
          const token =
            sessionStorage.getItem("accessToken") ||
            localStorage.getItem("accessToken");
          const res = await api.get<Collection[]>("/collections", {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ collections: res.data });
        } catch (err) {
          console.error("Fetch collections failed", err);

          const isGuest = sessionStorage.getItem("guest") === "true";
          if (isGuest && !get().activeRequest) {
            get().createTemporaryRequest();
          }
        }

      },

      /* -------- Requests -------- */
      fetchRequests: async (collectionId) => {
        try {
          const token =
            sessionStorage.getItem("accessToken") ||
            localStorage.getItem("accessToken");
          const res = await api.get<RequestItem[]>(
            `/requests/collection/${collectionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const requestsWithDefaults = res.data.map((r) => ({
            ...r,
            method: r.method || "GET",
            headers: r.headers || {},
            body: r.body || {},
            isTemporary: false,
            response: null, // always reset
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

      createCollection: async (name) => {
        try {
          const token =
            sessionStorage.getItem("accessToken") ||
            localStorage.getItem("accessToken");
          await api.post(
            "/collections",
            { name },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          await get().fetchCollections();
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
        const updatedTabs = activeTabIds.filter((t) => t !== id);

        if (activeRequest && activeRequest._id === id) {
          const allRequests = Object.values(requestsByCollection || {}).flat();
          const nextRequest =
            allRequests.find((r) => updatedTabs.includes(r._id)) || null;
          set({
            activeTabIds: updatedTabs,
            activeRequest: nextRequest,
            response: nextRequest ? nextRequest.response ?? null : null,
          });
        } else {
          set({ activeTabIds: updatedTabs });
        }
      },
      
      createTemporaryRequest: () => {
        const temp: RequestItem = {
          _id: "guest-temp",
          name: "Guest Request",
          method: "GET",
          url: "",
          headers: {},
          body: {},
          isTemporary: true,
          collection: null,
          response: null,
        };

        set({
          activeRequest: temp,
          activeTabIds: ["guest-temp"],
          response: null,
        });
      },
      createRequest: (collectionId) => {
        const newRequest: RequestItem = {
          _id: crypto.randomUUID(),
          name: "New Request",
          method: "GET",
          url: "",
          headers: {},
          body: {},
          isTemporary: true,
          collection: collectionId ?? get().activeCollection,
          response: null,
        };

        set((state) => {
          const updatedRequests = {
            ...state.requestsByCollection,
            [newRequest.collection || "uncategorized"]: [
              ...(state.requestsByCollection[newRequest.collection || "uncategorized"] || []),
              newRequest,
            ],
          };
          return {
            requestsByCollection: updatedRequests,
            activeTabIds: [...state.activeTabIds, newRequest._id],
            activeRequest: newRequest,
            response: null,
          };
        });
      },

      openRequest: (request) => {
        const { activeTabIds } = get();
        if (!activeTabIds.includes(request._id)) {
          set({ activeTabIds: [...activeTabIds, request._id] });
        }
        set({ activeRequest: request, response: null });
      },

      updateRequest: (id, updates) => {
        set((state) => {
          const updated = { ...state.requestsByCollection };
          for (const colId in updated) {
            updated[colId] = updated[colId].map((r) =>
              r._id === id ? { ...r, ...updates } : r
            );
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
        const { activeRequest, updateRequest, setResponse, setLoading } = get();
        if (!activeRequest) return console.error("No active request to execute");

        setLoading(true);

        try {
          const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || "";

          const headers = token ? { Authorization: `Bearer ${token}` } : {};


          if (activeRequest.isTemporary) {
            console.log("🌐 Executing TEMP request...");

            const startTemp = performance.now();
            const res = await api.post(
              "/requests/proxy",
              {
                url: activeRequest.url,
                method: activeRequest.method,
                headers: activeRequest.headers,
                body: activeRequest.body,
              },
              { headers }
            );

            const durationTemp = performance.now() - startTemp;

            let resData = res.data.data || res.data;
            if (typeof resData === "string" && resData.trim().startsWith("<!DOCTYPE")) {
              resData = { html: resData };
            }
            const enhancedResponse = {
              data: resData,
              status: res.data.status || res.status,
              statusText: res.data.statusText || res.statusText,
              headers: res.data.headers || res.headers,
              time: Math.round(durationTemp),
            };

            console.log("Enhanced TEMP response:", enhancedResponse);

            // First update the request with the new response
            updateRequest(activeRequest._id, { response: enhancedResponse });

            // Then set activeRequest and global response state in one atomic update:
            const { _id } = activeRequest;
            if (!_id) {
              console.error("Request ID missing, cannot update");
              return;
            }

            set(state => ({
              activeRequest: {
                ...state.activeRequest!,
                response: enhancedResponse,
                _id: _id,
              },
              response: enhancedResponse,
            }));


          } else {
            console.log("💾 Executing SAVED request...");

            const startSaved = performance.now();
            const res = await api.post(`/requests/${activeRequest._id}/execute`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const durationSaved = performance.now() - startSaved;

            const backendResponse = res.data;
            const enhancedResponse = { ...backendResponse, time: Math.round(durationSaved) };

            console.log("Enhanced SAVED response:", enhancedResponse);

            updateRequest(activeRequest._id, { response: enhancedResponse });
            set({ activeRequest: { ...activeRequest, response: enhancedResponse } });
            console.log("State after setResponse:", enhancedResponse);
            setResponse(enhancedResponse);
          }
        } catch (err: any) {
          console.error("❌ Execute request failed:", err.message);
          setResponse({ error: err.message });
        } finally {
          setLoading(false);
        }
      },

      /* -------- Save / Delete -------- */
      saveRequest: async (id) => {
        const { activeRequest, fetchRequests } = get();
        const req = activeRequest;
        if (!req) {
          console.error("Request not found for save");
          return;
        }

        const token =
          sessionStorage.getItem("accessToken") ||
          localStorage.getItem("accessToken");

        try {
          let savedReq: RequestItem;

          if (req.isTemporary) {
            // New request → create
            const res = await api.post<RequestItem>(
              "/requests",
              req,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            savedReq = res.data;
            get().updateRequest(req._id, { ...savedReq, isTemporary: false });
          } else {
            // Existing request → update
            await api.put(
              `/requests/${id}`,
              req,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            savedReq = req;
          }
          if (!req.collection || req.collection.trim() === "") {
            throw new Error("Request not saved. Please select a collection.");
          }
          if (req.collection) await fetchRequests(req.collection);
        } catch (err: any) {
          const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Unknown error";
          console.error("Save request failed:", msg);
          throw new Error(msg);
        }
      },

      deleteRequest: async (id) => {
        const { activeRequest, fetchRequests } = get();
        if (!activeRequest) {
          console.error("Request not found for delete");
          return;
        }

        const token =
          sessionStorage.getItem("accessToken") ||
          localStorage.getItem("accessToken");

        try {
          if (!activeRequest.isTemporary) {
            await api.delete(`/requests/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }

          if (activeRequest.collection) {
            await fetchRequests(activeRequest.collection);
          }

          set({ activeRequest: null, response: null });
        } catch (err: any) {
          console.error("Delete request failed:", err.response?.data || err.message);
        }
      },

    }),
    {
      name: "reqflow-session",
      getStorage: () => sessionStorage,
      partialize: (state) => ({
        collections: state.collections,
        requestsByCollection: state.requestsByCollection,
        activeTabIds: state.activeTabIds,
        activeRequest: state.activeRequest,
        activeCollection: state.activeCollection,
        loading: state.loading,
      }),
    }
  )
);
