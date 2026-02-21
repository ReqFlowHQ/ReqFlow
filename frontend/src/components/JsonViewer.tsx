import React, { useMemo, useState } from "react";
import { useRequests, type RunHistoryItem } from "../hooks/useRequests";
import { shallow } from "zustand/shallow";
import api from "../api/axios";
import {
  getHeaderValue,
  isHtmlContentType,
  sanitizeHtmlForPreview,
} from "../utils/responseViewer";

type ViewMode = "pretty" | "raw" | "preview" | "headers" | "history";
type ParsedBase =
  | { type: "json"; value: unknown }
  | { type: "html" | "text"; raw: string }
  | null;

type DiffValueChange = "added" | "removed" | "changed";
type DiffLineChange = "context" | "added" | "removed";

interface RunDiffSummary {
  hasDifferences: boolean;
  changed: number;
  added: number;
  removed: number;
  truncated: boolean;
}

interface RunDiffMeta {
  runId: string;
  requestId: string;
  status: number;
  statusText: string;
  createdAt: string;
}

interface RunJsonDiffEntry {
  path: string;
  type: DiffValueChange;
  before?: unknown;
  after?: unknown;
}

interface RunTextDiffEntry {
  type: DiffLineChange;
  line: string;
  baseLineNumber: number | null;
  compareLineNumber: number | null;
}

interface RunDiffPayload {
  mode: "json" | "text";
  baseRun: RunDiffMeta;
  compareRun: RunDiffMeta;
  summary: RunDiffSummary;
  json?: {
    entries: RunJsonDiffEntry[];
  };
  text?: {
    lines: RunTextDiffEntry[];
  };
}

const stringifyDiffValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  try {
    const serialized = JSON.stringify(value, null, 2);
    return typeof serialized === "string" ? serialized : "";
  } catch {
    return String(value ?? "");
  }
};

export default function JsonViewer() {
  const {
    response,
    activeRequest,
    executionHistoryByRequest,
    fetchExecutionHistory,
    loadMoreExecutionHistory,
  } = useRequests(
    (state) => ({
      response: state.response,
      activeRequest: state.activeRequest,
      executionHistoryByRequest: state.executionHistoryByRequest,
      fetchExecutionHistory: state.fetchExecutionHistory,
      loadMoreExecutionHistory: state.loadMoreExecutionHistory,
    }),
    shallow
  );
  const currentResponse = response || activeRequest?.response || null;
  const jsonStringCacheRef = React.useRef<
    WeakMap<object, { raw?: string; pretty?: string }>
  >(new WeakMap());

  const [viewMode, setViewMode] = useState<ViewMode>("pretty");
  const responseContentType = getHeaderValue(currentResponse?.headers, "content-type");
  const isHtmlResponseByHeader = isHtmlContentType(responseContentType);

  const parsedBase = useMemo<ParsedBase>(() => {
    if (!currentResponse?.data) return null;

    let raw: string;
    let type: "json" | "html" | "text";

    const data = currentResponse.data;

    // 🔥 UNWRAP backend runtime format
    if (typeof data === "object" && data !== null) {
      if ("html" in data && typeof data.html === "string") {
        raw = data.html;
        type = "html";
      } else if ("text" in data && typeof data.text === "string") {
        raw = data.text;
        type = "text";
      } else {
        // JSON object (format lazily by view mode to reduce render cost)
        return {
          type: "json",
          value: data,
        };
      }
    } else {
      raw = String(data);
      type =
        isHtmlResponseByHeader ||
        raw.trim().toLowerCase().startsWith("<!doctype") ||
        raw.trim().toLowerCase().startsWith("<html")
          ? "html"
          : "text";
    }
    return {
      type,
      raw,
    };
  }, [currentResponse, isHtmlResponseByHeader]);

  const parsedContent = useMemo(() => {
    if (
      !parsedBase ||
      viewMode === "headers" ||
      viewMode === "preview" ||
      viewMode === "history"
    ) {
      return null;
    }

    if (parsedBase.type === "json") {
      const valueObject = parsedBase.value as object;
      let cached = jsonStringCacheRef.current.get(valueObject);
      if (!cached) {
        cached = {};
        jsonStringCacheRef.current.set(valueObject, cached);
      }

      if (viewMode === "pretty") {
        if (!cached.pretty) {
          cached.pretty = JSON.stringify(valueObject, null, 2);
        }
        return cached.pretty;
      }

      if (!cached.raw) {
        cached.raw = JSON.stringify(valueObject);
      }
      return cached.raw;
    }

    if (parsedBase.type === "html") {
      return parsedBase.raw;
    }

    return parsedBase.raw;
  }, [parsedBase, viewMode]);

  const isHtmlResponse = isHtmlResponseByHeader || parsedBase?.type === "html";
  const previewHtml =
    parsedBase && parsedBase.type === "html"
      ? sanitizeHtmlForPreview(parsedBase.raw)
      : "";
  const headersPretty = useMemo(
    () => JSON.stringify(currentResponse?.headers || {}, null, 2),
    [currentResponse?.headers]
  );

  React.useEffect(() => {
    if (isHtmlResponse && viewMode === "pretty") {
      setViewMode("raw");
    }
  }, [isHtmlResponse, viewMode]);

  const canShowHistory = Boolean(activeRequest && !activeRequest.isTemporary);
  const historyState = canShowHistory
    ? executionHistoryByRequest[activeRequest!._id]
    : undefined;
  const [baseRunId, setBaseRunId] = useState<string | null>(null);
  const [compareRunId, setCompareRunId] = useState<string | null>(null);
  const [runDiff, setRunDiff] = useState<RunDiffPayload | null>(null);
  const [runDiffLoading, setRunDiffLoading] = useState(false);
  const [runDiffError, setRunDiffError] = useState<string | null>(null);
  const [showDiffPanel, setShowDiffPanel] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  const hasMountedViewModeRef = React.useRef(false);
  const viewerRootRef = React.useRef<HTMLDivElement | null>(null);
  const viewerBodyRef = React.useRef<HTMLDivElement | null>(null);
  const historyScrollRef = React.useRef<HTMLDivElement | null>(null);
  const historyScrollTopRef = React.useRef(0);
  const diffSectionRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!canShowHistory || viewMode !== "history") return;
    if (historyState?.loading) return;
    if (historyState?.loaded && (historyState.items?.length || 0) > 0) return;
    void fetchExecutionHistory(activeRequest!._id, { reset: true });
  }, [
    canShowHistory,
    viewMode,
    activeRequest?._id,
    historyState?.loading,
    historyState?.loaded,
    historyState?.items?.length,
    fetchExecutionHistory,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const onMediaChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onMediaChange);
    } else {
      mediaQuery.addListener(onMediaChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", onMediaChange);
      } else {
        mediaQuery.removeListener(onMediaChange);
      }
    };
  }, []);

  React.useEffect(() => {
    setBaseRunId(null);
    setCompareRunId(null);
    setRunDiff(null);
    setRunDiffLoading(false);
    setRunDiffError(null);
    setShowDiffPanel(false);
  }, [activeRequest?._id]);

  React.useEffect(() => {
    if (!baseRunId) return;
    const hasBaseRun = Boolean(
      (historyState?.items || []).some((run) => run._id === baseRunId)
    );
    if (!hasBaseRun) {
      setBaseRunId(null);
      setCompareRunId(null);
      setRunDiff(null);
      setRunDiffError(null);
      setShowDiffPanel(false);
    }
  }, [historyState?.items, baseRunId]);

  React.useEffect(() => {
    if (!isMobileViewport || !showDiffPanel || !runDiffLoading) return;
    const rafId = window.requestAnimationFrame(() => {
      diffSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isMobileViewport, showDiffPanel, runDiffLoading]);

  React.useEffect(() => {
    if (!isMobileViewport) return;
    if (!hasMountedViewModeRef.current) {
      hasMountedViewModeRef.current = true;
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      const rootEl = viewerRootRef.current;
      if (!rootEl) return;
      const top = rootEl.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      if (viewerBodyRef.current) {
        viewerBodyRef.current.scrollTop = 0;
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [viewMode, isMobileViewport]);

  const handleSetBaseRun = (runId: string) => {
    if (runId === baseRunId) {
      setBaseRunId(null);
      setCompareRunId(null);
      setRunDiff(null);
      setRunDiffError(null);
      setShowDiffPanel(false);
      return;
    }
    setBaseRunId(runId);
    setCompareRunId(null);
    setRunDiff(null);
    setRunDiffError(null);
    setShowDiffPanel(false);
  };

  const handleCompareRun = async (targetRunId: string) => {
    if (!baseRunId || baseRunId === targetRunId) {
      return;
    }

    if (!isMobileViewport && historyScrollRef.current) {
      historyScrollTopRef.current = historyScrollRef.current.scrollTop;
    }
    if (isMobileViewport && typeof document !== "undefined") {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
    }
    setShowDiffPanel(true);
    setRunDiffLoading(true);
    setRunDiffError(null);

    try {
      const res = await api.get<RunDiffPayload>(`/runs/${baseRunId}/diff`, {
        params: { compareTo: targetRunId },
      });
      setCompareRunId(targetRunId);
      setRunDiff(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load diff";
      setRunDiffError(msg);
    } finally {
      setRunDiffLoading(false);
    }
  };

  const handleCloseDiffPanel = () => {
    setShowDiffPanel(false);
    setCompareRunId(null);
    setRunDiffError(null);
    if (!isMobileViewport && historyScrollRef.current) {
      const lastScrollTop = historyScrollTopRef.current;
      requestAnimationFrame(() => {
        if (historyScrollRef.current) {
          historyScrollRef.current.scrollTop = lastScrollTop;
        }
      });
    }
  };

  const status = currentResponse?.status;
  const statusText = currentResponse?.statusText;
  const time = currentResponse?.time;
  const hasResponse = Boolean(currentResponse);
  const isHistoryView = viewMode === "history";
  const isHeadersView = viewMode === "headers";
  const isPreviewView = viewMode === "preview";
  const isBodyTextView = viewMode === "pretty" || viewMode === "raw";
  const desktopSplitActive = showDiffPanel && !isMobileViewport;
  const viewerRootClassName = isMobileViewport
    ? "block w-full max-w-full min-w-0 overflow-x-hidden bg-gradient-to-br from-white/80 via-slate-50/70 to-white/70 dark:bg-gradient-to-br dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-950/60 border-l border-slate-200/70 dark:border-slate-700/70 backdrop-blur-xl"
    : "flex min-w-0 flex-col h-full min-h-[44vh] md:min-h-0 bg-gradient-to-br from-white/80 via-slate-50/70 to-white/70 dark:bg-gradient-to-br dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-950/60 border-l border-slate-200/70 dark:border-slate-700/70 backdrop-blur-xl";
  const viewerBodyClassName = isMobileViewport
    ? "w-full max-w-full min-w-0 overflow-x-hidden p-4 font-mono text-sm text-slate-800 dark:text-slate-100"
    : "flex-1 min-w-0 overflow-visible lg:overflow-auto p-4 font-mono text-sm text-slate-800 dark:text-slate-100";

  const diffPanelSurface = (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-slate-300/70 bg-white/80 dark:border-slate-600/70 dark:bg-slate-900/65">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:text-slate-300">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-200/80 px-2 py-0.5 dark:bg-slate-700/80">
            {runDiff ? `Mode: ${runDiff.mode.toUpperCase()}` : "Diff Viewer"}
          </span>
          {runDiff && (
            <span>
              Δ changed: {runDiff.summary.changed}, +{runDiff.summary.added}, -
              {runDiff.summary.removed}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCloseDiffPanel}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300/70 bg-white/80 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700/70"
          aria-label="Close diff panel"
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {runDiffLoading && (
          <div className="rounded-md border border-slate-200/70 bg-white/65 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-slate-300">
            Computing diff...
          </div>
        )}

        {!runDiffLoading && runDiffError && (
          <div className="rounded-md border border-rose-300/70 bg-rose-100/70 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {runDiffError}
          </div>
        )}

        {!runDiffLoading && !runDiffError && !runDiff && (
          <div className="rounded-md border border-slate-200/70 bg-white/65 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-slate-300">
            Select a base run and compare another run to view a diff.
          </div>
        )}

        {!runDiffLoading && !runDiffError && runDiff && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span>
                Base: {new Date(runDiff.baseRun.createdAt).toLocaleString()}
              </span>
              <span>
                Compare: {new Date(runDiff.compareRun.createdAt).toLocaleString()}
              </span>
              {runDiff.summary.truncated && (
                <span className="text-amber-700 dark:text-amber-300">
                  Truncated for safety limits.
                </span>
              )}
            </div>

            {runDiff.mode === "json" && (
              <div className="space-y-2">
                {(runDiff.json?.entries || []).length === 0 && (
                  <div className="rounded-md border border-emerald-300/70 bg-emerald-100/70 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                    No JSON differences found.
                  </div>
                )}
                {(runDiff.json?.entries || []).map((entry, index) => (
                  <div
                    key={`${entry.path}-${index}`}
                    className="rounded-md border border-slate-200/70 bg-white/80 p-2 text-xs dark:border-slate-700/70 dark:bg-slate-950/45"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 font-semibold ${
                          entry.type === "added"
                            ? "bg-emerald-500 text-white"
                            : entry.type === "removed"
                              ? "bg-rose-500 text-white"
                              : "bg-amber-500 text-white"
                        }`}
                      >
                        {entry.type.toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-100">
                        {entry.path}
                      </span>
                    </div>
                    {entry.type !== "added" && (
                      <pre className="mb-1 max-w-full whitespace-pre-wrap break-all rounded-md bg-rose-50/80 p-2 text-[11px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                        {stringifyDiffValue(entry.before)}
                      </pre>
                    )}
                    {entry.type !== "removed" && (
                      <pre className="max-w-full whitespace-pre-wrap break-all rounded-md bg-emerald-50/80 p-2 text-[11px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                        {stringifyDiffValue(entry.after)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {runDiff.mode === "text" && (
              <pre className="max-h-full overflow-auto rounded-md border border-slate-200/70 bg-white/80 p-2 text-xs dark:border-slate-700/70 dark:bg-slate-950/45">
                {(runDiff.text?.lines || []).map((line, index) => {
                  const prefix =
                    line.type === "added"
                      ? "+"
                      : line.type === "removed"
                        ? "-"
                        : " ";
                  const colorClass =
                    line.type === "added"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : line.type === "removed"
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-slate-700 dark:text-slate-300";

                  return (
                    <div key={`${line.type}-${index}`} className={colorClass}>
                      {prefix} {line.line}
                    </div>
                  );
                })}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const historyListContent = (
    <div className="space-y-3">
      {!canShowHistory && (
        <div className="rounded-md border border-slate-200/70 bg-white/65 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-slate-300">
          Execution history is available for saved requests.
        </div>
      )}

      {canShowHistory &&
        historyState?.loading &&
        historyState.items.length === 0 && (
          <div className="rounded-md border border-slate-200/70 bg-white/65 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-slate-300">
            Loading execution history...
          </div>
        )}

      {canShowHistory && historyState?.error && (
        <div className="rounded-md border border-rose-300/70 bg-rose-100/70 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {historyState.error}
        </div>
      )}

      {canShowHistory &&
        (historyState?.items || []).map((run: RunHistoryItem) => {
          const assertionCount = run.assertionResults?.length || 0;
          const passedCount =
            run.assertionResults?.filter((entry) => entry.passed).length || 0;
          const isBaseRun = baseRunId === run._id;
          const isComparedRun = compareRunId === run._id;
          return (
            <div
              key={run._id}
              className={`rounded-md border px-3 py-2 ${
                isComparedRun
                  ? "border-cyan-400/70 bg-cyan-100/50 dark:border-cyan-400/50 dark:bg-cyan-500/10"
                  : isBaseRun
                    ? "border-indigo-400/70 bg-indigo-100/50 dark:border-indigo-400/50 dark:bg-indigo-500/10"
                    : "border-slate-200/70 bg-white/65 dark:border-slate-700/70 dark:bg-slate-900/55"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-md px-2 py-0.5 text-white ${
                    run.status >= 200 && run.status < 300
                      ? "bg-emerald-500"
                      : run.status >= 400
                        ? "bg-rose-500"
                        : "bg-amber-500"
                  }`}
                >
                  {run.status} {run.statusText || ""}
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {run.durationMs} ms
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {new Date(run.createdAt).toLocaleString()}
                </span>
                {assertionCount > 0 && (
                  <span className="text-slate-600 dark:text-slate-300">
                    Assertions: {passedCount}/{assertionCount}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetBaseRun(run._id)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    isBaseRun
                      ? "border-indigo-500/70 bg-indigo-500 text-white"
                      : "border-slate-300/70 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700/70"
                  }`}
                >
                  {isBaseRun ? "Base Run Selected" : "Set As Base"}
                </button>
                <button
                  type="button"
                  disabled={!baseRunId || isBaseRun || runDiffLoading}
                  onClick={() => {
                    void handleCompareRun(run._id);
                  }}
                  className="rounded-md border border-cyan-300/70 bg-cyan-50/80 px-2 py-1 text-[11px] font-medium text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
                >
                  Compare To Base
                </button>
              </div>
            </div>
          );
        })}

      {canShowHistory &&
        historyState &&
        !historyState.loading &&
        historyState.loaded &&
        historyState.items.length === 0 &&
        !historyState.error && (
          <div className="rounded-md border border-slate-200/70 bg-white/65 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-slate-300">
            No execution history yet.
          </div>
        )}

      {canShowHistory && historyState?.hasMore && (
        <button
          type="button"
          onClick={() => void loadMoreExecutionHistory(activeRequest!._id)}
          disabled={historyState.loading}
          className="rounded-md border border-slate-300/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600/70 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/70"
        >
          {historyState.loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );

  return (
    <div
      ref={viewerRootRef}
      data-json-viewer
      className={viewerRootClassName}>


      {/* Header */}
      <div className="flex-shrink-0 min-w-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-200/70 dark:border-slate-700/70 bg-white/65 dark:bg-slate-900/70">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span
            className={`px-2.5 py-1 rounded-md text-white shadow-sm ${
              typeof status === "number"
                ? status >= 200 && status < 300
                  ? "bg-emerald-500"
                  : status >= 400
                    ? "bg-rose-500"
                    : "bg-amber-500"
                : "bg-slate-500"
            }`}
          >
            {typeof status === "number" ? `${status} ${statusText || ""}` : "No response"}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {typeof time === "number" ? `${time} ms` : "—"}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 w-full sm:w-auto overflow-x-auto">
          {([
            "pretty",
            "raw",
            ...(isHtmlResponse ? ["preview"] : []),
            "headers",
            ...(canShowHistory ? ["history"] : []),
          ] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                if (mode === "pretty" && isHtmlResponse) return;
                setViewMode(mode);
              }}
              disabled={mode === "pretty" && isHtmlResponse}
              className={`px-3 py-1.5 text-xs rounded-md transition ${viewMode === mode
                ? "bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white shadow-sm"
                : mode === "pretty" && isHtmlResponse
                  ? "bg-slate-200/60 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-600/80"
                }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {!isHistoryView && isHtmlResponse && (
        <div className="mx-4 mt-3 rounded-md border border-amber-300/70 bg-amber-100/70 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          ⚠ Upstream returned HTML content (preview available)
        </div>
      )}

      {/* Body */}
      <div ref={viewerBodyRef} className={viewerBodyClassName}>
        {!isHistoryView && isHeadersView && (
          <pre className="max-w-full whitespace-pre-wrap break-all overflow-x-auto">
            {headersPretty}
          </pre>
        )}

        {!isHistoryView && !hasResponse && (
          <div className="rounded-md border border-slate-200/70 bg-white/65 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/55 dark:text-slate-300">
            Response will appear here.
          </div>
        )}

        {!isHistoryView && isPreviewView && isHtmlResponse && (
          <div className="h-full min-h-[320px] overflow-hidden rounded-md border border-slate-300/70 bg-white dark:border-slate-600/70 dark:bg-slate-800">
            <iframe
              title="HTML preview"
              sandbox="allow-same-origin"
              srcDoc={previewHtml}
              className="h-full min-h-[320px] w-full border-0 bg-white"
            />
          </div>
        )}

        {!isHistoryView &&
          isBodyTextView &&
          parsedBase &&
          parsedContent !== null && (
          <pre className="max-w-full whitespace-pre-wrap break-all overflow-x-auto">
            {parsedContent}
          </pre>
        )}

        {isHistoryView && !isMobileViewport && (
          <div className="flex h-full min-h-0 flex-col">
            <div
              ref={historyScrollRef}
              onScroll={() => {
                if (historyScrollRef.current) {
                  historyScrollTopRef.current = historyScrollRef.current.scrollTop;
                }
              }}
              className="min-h-0 overflow-y-auto pr-1 transition-[max-height] duration-200 ease-in-out"
              style={{
                maxHeight: desktopSplitActive ? "58%" : "100%",
                overflowAnchor: "none",
              }}
            >
              {historyListContent}
            </div>

            <div
              className={`min-h-0 overflow-hidden transition-all duration-200 ease-in-out ${
                desktopSplitActive ? "pt-3" : "pt-0"
              }`}
              style={{
                maxHeight: desktopSplitActive ? "42%" : "0px",
                opacity: desktopSplitActive ? 1 : 0,
                transform: desktopSplitActive ? "translateY(0)" : "translateY(8px)",
              }}
              aria-hidden={!desktopSplitActive}
            >
              {diffPanelSurface}
            </div>
          </div>
        )}

        {isHistoryView && isMobileViewport && (
          <div className="space-y-3" style={{ overflowAnchor: "none" }}>
            {historyListContent}
            {showDiffPanel && (
              <div ref={diffSectionRef}>{diffPanelSurface}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
