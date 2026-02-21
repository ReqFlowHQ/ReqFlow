import type { RequestAuth, RequestAuthType } from "../utils/requestAuth";
import Dropdown from "./Dropdown";

interface AuthEditorProps {
  auth: RequestAuth;
  requestId: string;
  updateRequest: (id: string, updates: Partial<any>) => void;
}

const AUTH_TYPES: Array<{ value: RequestAuthType; label: string }> = [
  { value: "none", label: "No Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "apikey", label: "API Key" },
];

export default function AuthEditor({ auth, requestId, updateRequest }: AuthEditorProps) {
  const currentAuth: RequestAuth = auth || { type: "none" };

  const setAuth = (next: RequestAuth) => {
    updateRequest(requestId, { auth: next });
  };

  const mode = currentAuth.type || "none";

  return (
    <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/55 p-4 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/55">
      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Auth Type
        </label>
        <Dropdown
          value={mode}
          onChange={(nextType) => {
            if (nextType === "none") {
              setAuth({ type: "none" });
              return;
            }
            if (nextType === "bearer") {
              setAuth({ type: "bearer", token: "" });
              return;
            }
            if (nextType === "basic") {
              setAuth({ type: "basic", username: "", password: "" });
              return;
            }
            setAuth({
              type: "apikey",
              apiKeyName: "",
              apiKeyValue: "",
              apiKeyIn: "header",
            });
          }}
          options={AUTH_TYPES}
          ariaLabel="Select auth type"
        />
      </div>

      {mode === "bearer" && (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Token
          </label>
          <input
            type="password"
            value={currentAuth.token || ""}
            onChange={(event) =>
              setAuth({ ...currentAuth, type: "bearer", token: event.target.value })
            }
            placeholder="Paste bearer token"
            className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
          />
        </div>
      )}

      {mode === "basic" && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Username
            </label>
            <input
              value={currentAuth.username || ""}
              onChange={(event) =>
                setAuth({ ...currentAuth, type: "basic", username: event.target.value })
              }
              placeholder="Username"
              className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={currentAuth.password || ""}
              onChange={(event) =>
                setAuth({ ...currentAuth, type: "basic", password: event.target.value })
              }
              placeholder="Password"
              className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
            />
          </div>
        </div>
      )}

      {mode === "apikey" && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Key
            </label>
            <input
              value={currentAuth.apiKeyName || ""}
              onChange={(event) =>
                setAuth({ ...currentAuth, type: "apikey", apiKeyName: event.target.value })
              }
              placeholder="x-api-key"
              className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Value
            </label>
            <input
              type="password"
              value={currentAuth.apiKeyValue || ""}
              onChange={(event) =>
                setAuth({ ...currentAuth, type: "apikey", apiKeyValue: event.target.value })
              }
              placeholder="API key value"
              className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Add To
            </label>
            <Dropdown
              value={currentAuth.apiKeyIn || "header"}
              onChange={(nextTarget) =>
                setAuth({
                  ...currentAuth,
                  type: "apikey",
                  apiKeyIn: nextTarget,
                })
              }
              options={[
                { value: "header", label: "Header" },
                { value: "query", label: "Query Params" },
              ]}
              ariaLabel="Select API key location"
            />
          </div>
        </div>
      )}
    </div>
  );
}
