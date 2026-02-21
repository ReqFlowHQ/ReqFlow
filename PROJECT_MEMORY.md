# PROJECT_MEMORY
Version: 2.0.1-alpha-metric-fix
Last updated: 2026-02-18
Canonicality: Read this file first in every session; treat it as source of truth.

## Current Architecture Summary
- Frontend: React + Vite + TypeScript (`frontend/`), Zustand store for workspace state.
- Backend: Express + TypeScript (`backend/`), cookie auth + CSRF/origin protection.
- Outbound execution: centralized in `backend/src/utils/executeRequest.ts` with keep-alive agents, SSRF checks, streaming reads, and structured timing callbacks.
- Data access: repository abstraction (`backend/src/data/`) with pluggable drivers.

## Repository Abstraction Status
- Repository interfaces: `backend/src/data/repositories/interfaces.ts`.
- Driver factory/registry: `backend/src/data/repositories/factory.ts`, `backend/src/data/repositories/registry.ts`.
- Mongo implementations: `backend/src/data/mongo/*`.
- SQLite implementations: `backend/src/data/sqlite/*`.
- Controller dependency rule: request/collection controllers use repository interfaces, not raw model calls.
- Driver selection:
  - `DATA_REPOSITORY=mongo` (default)
  - `DATA_REPOSITORY=sqlite` (pluggable)

## SQLite Schema
Source: `backend/src/data/sqlite/migrations.ts`

### Tables
- `collections(id, user_id, name, description, created_at, updated_at)`
- `requests(id, user_id, collection_id, name, method, url, params_json, auth_json, headers_json, body_json, response_json, created_at, updated_at)`
- `runs(id, user_id, request_id, status, status_text, duration_ms, response_json, assertion_results_json, created_at, updated_at)`
- `assertions(id, user_id, request_id, name, rule_json, enabled, created_at, updated_at)`
- `monitors(id, user_id, request_id, name, schedule_cron, enabled, config_json, last_run_at, next_run_at, created_at, updated_at)`
- `_migrations(version, name, applied_at)`

### Indexes
- `idx_collections_user_created (user_id, created_at DESC)`
- `idx_requests_user_collection_updated (user_id, collection_id, updated_at DESC)`
- `idx_requests_user_updated (user_id, updated_at DESC)`
- `idx_runs_request_created (request_id, created_at DESC)`
- `idx_runs_user_created (user_id, created_at DESC)`
- `idx_assertions_request_enabled (request_id, enabled, updated_at DESC)`
- `idx_monitors_user_due (user_id, enabled, next_run_at)`
- `idx_monitors_request (request_id)`

### SQLite Runtime Settings
- WAL mode enabled (`journal_mode=WAL`)
- `synchronous=NORMAL`
- `foreign_keys=ON`
- `busy_timeout=5000`

## Performance Metrics (Internal Benchmarks)
Instrumentation fields (structured log event `request_execution_performance`):
- `network_ms`
- `db_ms`
- `assertions_ms`
- `total_internal_ms`
- plus split network details: `outbound_proxy_ms`, `response_receive_ms`

Latency definition (canonical):
- `latency_ms` shown in UI and persisted in run history maps to upstream network latency only.
- Canonical source metric: `network_ms` from `executeRequest` timing callback.
- Excludes browser stopwatch time, edge tunnel time outside backend upstream call, and render cost.
- `total_internal_ms` remains an internal overhead KPI and is not used for displayed/persisted run latency.

Targets:
- Local mode: `< 50ms` internal overhead (p95)
- Cloud mode: `< 100ms` internal overhead (p95)

Latest synthetic (mocked upstream/repo, no external network):
- `POST /api/requests/:id/execute` controller return latency (400 samples):
  - p50 `0.004ms`, p95 `0.008ms`, p99 `0.033ms`, avg `0.008ms`
- `GET /api/requests/:id/history` controller latency (500 samples):
  - p50 `0.001ms`, p95 `0.002ms`, avg `0.005ms`

Note: These are in-process synthetic numbers to validate internal overhead shape only; production-like latency must be measured from runtime perf logs.

## API Contract Summary
Backward compatibility policy: existing endpoints remain stable unless explicitly versioned.

Stable existing routes (unchanged contracts):
- Auth: `/api/auth/*`
- Collections: `/api/collections/*`
- Requests CRUD + execute: `/api/requests/*`
- Runtime execute: `/api/runtime/execute`
- Guest status: `/api/guest/status`

New additive route (v2 phase 1):
- `GET /api/requests/:id/history?limit=20&before=<ISO>`
  - Response:
    - `items: Run[]`
    - `page: { limit, hasMore, nextCursor }`

New additive route (v2 phase 2):
- `GET /api/runs/:runId/diff?compareTo=<otherRunId>`
  - Response:
    - `mode: "json" | "text"`
    - `baseRun`, `compareRun`
    - `summary: { hasDifferences, changed, added, removed, truncated }`
    - `json.entries[]` (deep path-level changes) OR `text.lines[]` (line diff fallback)

## Environment Assumptions
- Backend runs on Node + Express, frontend calls `/api` with cookie auth.
- Required envs include auth/session/security settings (`JWT_SECRET`, OAuth vars, CORS/CSRF trusted origins).
- Data-layer envs:
  - `DATA_REPOSITORY`
  - `MONGO_URI` (for mongo driver and/or auth/session models)
  - `SQLITE_DB_PATH` (sqlite driver path)
  - `CONNECT_MONGO_FOR_AUTH` (optional dual-connect behavior)
- Perf/log envs:
  - `PERF_LOG_ENABLED`
  - `REQFLOW_MODE` (`local` or `cloud`)
  - `HTTP_REQUEST_LOGS`

## Known Constraints
- Cloudflare tunnel/public edge is used in hosted mode; origin/cookie/CSRF behavior must remain compatible.
- Local deployment model uses frontend->backend `/api` routing and cookie-based auth.
- Sandbox/dev environments may disallow local socket listen; use synthetic benchmarks or existing runtime logs when ports are unavailable.
- Existing frontend contracts must not break.

## Update execution-history-phase1
- What changed:
  - Added paginated execution history backend endpoint.
  - Extended `RunRepository` query support with cursor (`before`) + limit.
  - Added frontend execution history state + UI tab in response panel.
  - Added RunRepository integration validation test for history controller.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - `GET /api/requests/:id/history?limit=<n>&before=<ISO>`
- Performance impact:
  - Added read-only paginated query path; no blocking added to request execution response path.
  - Uses existing run indexes (`idx_runs_request_created`, `idx_runs_user_created`).
- Migration steps:
  - No DB migration required.
  - Deploy backend + frontend together to expose history UI.
  - Optional: start collecting perf log baselines from `request_execution_performance` events.

## Update response-diff-engine-phase1
- What changed:
  - Added on-demand run-to-run diff endpoint at `GET /api/runs/:runId/diff?compareTo=<otherRunId>`.
  - Added `RunRepository.findByIdForUser` across Mongo and SQLite drivers for secure per-run lookup.
  - Implemented diff engine in `backend/src/utils/responseDiff.ts`:
    - Deep JSON structural diff when both run bodies are JSON-like.
    - Line-based fallback diff for non-JSON/text/html payloads.
    - Output includes mode, run metadata, summary counts, and detailed entries.
  - Added frontend history compare controls and in-panel diff rendering in `frontend/src/components/JsonViewer.tsx`.
  - Added backend controller tests for JSON diff, text fallback, and validation/constraints.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - `GET /api/runs/:runId/diff?compareTo=<otherRunId>`
- Performance impact:
  - Diff computation is strictly on-demand on read path.
  - No changes to request execution persistence flow or async execution hot path.
  - Existing `POST /api/requests/:id/execute` latency path remains unchanged.
- Migration steps:
  - No DB migration required.
  - Deploy backend + frontend to enable compare actions in execution history UI.

## Update latency-metric-standardization-phase1
- What changed:
  - Standardized run latency to canonical upstream metric (`network_ms`) using `toCanonicalLatencyMs` in `backend/src/utils/performanceMetrics.ts`.
  - Updated saved execution flow so response payload (`latencyMs`) and persisted run `durationMs` use the same canonical value.
  - Updated proxy execution payload to include `latencyMs` for consistent UI timing behavior.
  - Updated frontend execution state to prefer backend `latencyMs` for immediate display, with browser stopwatch fallback only when absent.
  - Added backend tests for canonical latency conversion and execute-controller persistence alignment.
- Schema changes:
  - No table changes.
  - No new indexes.
- Metric source documentation:
  - Canonical latency source is `network_ms` (upstream request+response body timing inside backend).
  - `durationMs` in `runs` now represents this canonical upstream latency.
  - `total_internal_ms` continues to track backend internal overhead for p95 guardrail monitoring.
- Performance impact:
  - No additional blocking work added to execution hot path.
  - Metric selection changed only (from wall-clock controller span to upstream network span for run latency storage/display).
  - p95 target remains `total_internal_ms < 50ms` in local mode.
- Migration steps:
  - No DB migration required.
  - Deploy backend + frontend together so immediate UI timing and history timing remain aligned.

## Update history-diff-split-layout-phase1
- What changed:
  - Refactored `HISTORY` tab layout in `frontend/src/components/JsonViewer.tsx` into a vertical split container.
  - Top section is a persistent, scrollable history list (`overflow-y-auto`) that remains mounted.
  - Bottom section is a collapsible diff panel controlled by `showDiffPanel` with smooth transition (`duration-200`, `ease-in-out`, height + opacity + translate).
  - Added close action (`✕`) on diff panel header to collapse diff and restore full-height history.
  - Preserved existing compare/diff logic, API calls, and run diff rendering modes (JSON + text).
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only layout/state change; no backend/hot-path changes.
  - History list is not remounted during panel open/close, preserving scroll position and minimizing render churn.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update history-diff-responsive-mobile-phase1
- What changed:
  - Added responsive HISTORY diff behavior in `frontend/src/components/JsonViewer.tsx`.
  - Desktop (`>= 768px`) keeps split layout (scrollable history top + collapsible diff bottom).
  - Mobile (`< 768px`) uses a slide-up bottom-sheet overlay for diff instead of split layout.
  - Added viewport-safe sizing via `matchMedia` + `visualViewport` listeners (no fixed `100vh` usage).
  - Added dimmed overlay/backdrop with close affordance and preserved existing `✕` close button.
  - Reused existing diff render surface and compare logic unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only rendering/layout behavior; no backend changes.
  - History list container remains mounted; scroll position is preserved while opening/closing mobile overlay.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update history-diff-mobile-scroll-lock-fix
- What changed:
  - Removed mobile auto-scroll (`scrollIntoView`) behavior from `frontend/src/components/JsonViewer.tsx` to prevent page shift/top-bar hide anomalies.
  - Added mobile-only background scroll lock while diff sheet is open (`document.body.style.overflow = "hidden"`), with cleanup restoration on close/unmount.
  - Kept desktop split behavior, sheet animation, and diff logic unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only effect change; no backend/hot-path impact.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update history-diff-mobile-fixed-body-lock-fix
- What changed:
  - Replaced mobile diff-sheet background lock from `overflow`-based locking to fixed-body locking in `frontend/src/components/JsonViewer.tsx`.
  - On open: captures `scrollY` and applies `body { position: fixed; top: -scrollY; width: 100%; }` (plus left/right anchors).
  - On close: restores previous body inline styles and scroll position via `window.scrollTo(0, capturedScrollY)`.
  - Desktop behavior and diff animation logic remain unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only lock strategy adjustment; no backend changes.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update history-diff-mobile-scroll-model-simplification
- What changed:
  - Removed fixed-position body locking logic from `frontend/src/components/JsonViewer.tsx`.
  - Mobile compare action now performs `window.scrollTo({ top: 0, behavior: "auto" })` before opening diff sheet.
  - Added mobile sheet-open body class toggling (`body.diff-open`) based on `showDiffPanel && isMobileViewport`.
  - Added global CSS rule in `frontend/src/tailwind.css`: `body.diff-open { overflow: hidden; }`.
  - Desktop split mode and diff computation/rendering logic remain unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only state/style adjustment; no backend impact.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update history-diff-mobile-scroll-gating-fix
- What changed:
  - Gated history scroll capture/restore in `frontend/src/components/JsonViewer.tsx` to desktop-only paths (`!isMobileViewport`).
  - Mobile compare flow no longer captures history scroll from `historyScrollRef`.
  - Mobile close flow no longer restores `historyScrollRef.current.scrollTop`.
  - Bottom-sheet animation and diff compute/fetch logic remain unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only guard condition change; no backend impact.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update history-diff-render-path-separation-fix
- What changed:
  - Fully separated `HISTORY` render paths in `frontend/src/components/JsonViewer.tsx` by viewport mode.
  - Desktop path now exclusively owns the split-layout container, height transition math, and `historyScrollRef` capture/restore behavior.
  - Mobile path now renders history list in a normal container plus an independent fixed bottom-sheet overlay for diff (`position: fixed`, `bottom: 0`, transform-based slide transition).
  - Removed shared split-container mobile conditionals so mobile no longer depends on desktop max-height/split sizing behavior.
  - Preserved existing diff fetch/compute flow and diff rendering (JSON/text) unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only rendering-branch refactor; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update history-diff-android-scroll-hardening
- What changed:
  - Removed mobile viewport height state derived from `visualViewport` and deleted `visualViewport` resize listeners in `frontend/src/components/JsonViewer.tsx`.
  - Removed mobile compare-time `window.scrollTo(...)` call to avoid forced page jumps on Android Chrome.
  - Kept mobile bottom-sheet animation transform-only (`translateY`), with static max sheet cap via CSS (`max-h-[88svh]`) instead of runtime height math.
  - Added `overflow-anchor: none` to history scroll containers to reduce Android scroll anchoring jumps during sheet mount/unmount.
  - Added mobile-only active-element blur before opening diff sheet to avoid focus-driven scroll repositioning when overlay mounts.
  - Desktop split mode behavior and desktop scroll restore logic remain unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only behavior hardening; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update history-diff-mobile-inline-single-scroll-refactor
- What changed:
  - Refactored mobile (`< 768px`) `HISTORY` behavior in `frontend/src/components/JsonViewer.tsx` to a single-scroll model (body/page scroll only).
  - Removed mobile history nested scroll container behavior (`overflow-y-auto`, fixed overlay container path, and mobile max-height constraints).
  - Removed mobile bottom-sheet overlay entirely; mobile now renders diff inline below history list.
  - Added `diffSectionRef` and a mobile-only post-render effect to call `scrollIntoView({ behavior: "smooth", block: "start" })` when compare is triggered (via `showDiffPanel && runDiffLoading`).
  - Added `overflow-anchor: none` on mobile history wrapper to reduce Android anchor jumps in page flow.
  - Removed mobile scroll-lock coupling (`body.diff-open`) and associated CSS rule.
  - Kept desktop split layout, desktop scroll capture/restore behavior, and diff compute/fetch logic unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only layout/scroll model refactor; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update jsonviewer-mobile-root-scroll-container-fix
- What changed:
  - Updated `frontend/src/components/JsonViewer.tsx` to use separate root/body container class sets by viewport mode.
  - Mobile root container now uses `display: block` with no explicit height constraints (`h-full`, `min-h-*` removed on mobile path).
  - Mobile body container removed flex/overflow constraints (`flex-1`, `overflow-*` removed on mobile path) so page/body remains the only scroll container.
  - Desktop root/body class behavior remains unchanged (existing flex, height, and desktop overflow behavior retained).
  - Diff compare logic and desktop history scroll capture/restore logic remain unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only container class refactor; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dashboard-mobile-single-scroll-container-fix
- What changed:
  - Updated `frontend/src/pages/Dashboard.tsx` to use mobile-specific class branches for top-level shell/frame/workspace/editor/response wrappers.
  - Removed mobile scroll-container ownership from dashboard frame (`overflow-y-auto`) while keeping desktop scroll behavior unchanged.
  - Removed mobile-only height/overflow constraints that promoted nested scroll contexts in editor/response panes.
  - Updated `frontend/src/components/RequestEditor.tsx` with mobile-specific root/body classes to avoid `h-full` + internal `overflow-auto` ownership on mobile.
  - Desktop split behavior, diff logic, and desktop scroll capture/restore paths remain unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only layout container hardening; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update mobile-viewport-zoom-lock
- What changed:
  - Updated viewport meta tag in `frontend/index.html` to lock zoom on mobile devices.
  - New viewport content: `width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no`.
  - No runtime logic changes; applies globally via document head.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend static meta change only; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dashboard-mobile-horizontal-scroll-lock
- What changed:
  - Added mobile horizontal overflow hardening in `frontend/src/pages/Dashboard.tsx` using container-level guards only.
  - Hardened mobile dashboard wrappers with width and overflow guards (`w-full max-w-full overflow-x-hidden`) on shell/frame/main/workspace containers.
  - Updated mobile editor/viewer wrappers to enforce `max-w-full` and `overflow-x-hidden`:
    - `frontend/src/components/RequestEditor.tsx` mobile root/body class branches.
    - `frontend/src/components/JsonViewer.tsx` mobile root/body class branches.
  - Desktop layout and split behavior remain unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only layout/overflow hardening; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dashboard-mobile-vertical-scroll-stability-fix
- What changed:
  - Removed mobile document-level overflow mutation in `frontend/src/pages/Dashboard.tsx` (no direct `html/body` style writes).
  - Kept horizontal lock at container/class level and added explicit mobile `overflow-x-hidden overflow-y-visible` guards on workspace/response wrappers.
  - Wrapped decorative background glow elements in an internal clipped layer (`absolute inset-0 overflow-hidden`) to prevent blur overflow from creating extra scrollable area.
  - Desktop behavior remains unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only layout/overflow stabilization; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dashboard-mobile-tabs-sticky-offset-fix
- What changed:
  - Removed mobile sticky positioning from the tabs wrapper in `frontend/src/pages/Dashboard.tsx` (dropped `sticky top-[56px]`).
  - Tabs now render in normal document flow on mobile, eliminating sticky-offset gap/jump artifacts between topbar and editor content.
  - Desktop behavior remains unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only class adjustment; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update frontend-native-ui-removal-phase1
- What changed:
  - Added reusable UI primitives in `frontend/src/components/`:
    - `Modal.tsx` (ESC-close, backdrop blur, controlled open state, 200ms transitions).
    - `ConfirmModal.tsx` (reusable confirmation dialog built on `Modal`).
    - `Dropdown.tsx` (custom listbox dropdown with portal positioning, ESC close, arrow-key navigation, Enter/Space selection, controlled value).
  - Replaced all `window.prompt()` and `window.confirm()` usage in `frontend/src/components/EnvironmentManager.tsx` with controlled modal flows:
    - Create environment modal.
    - Rename environment modal.
    - Delete confirmation modal.
  - Replaced native `<select>` usage with `Dropdown` in:
    - `frontend/src/components/EnvironmentManager.tsx` (environment selector).
    - `frontend/src/components/AuthEditor.tsx` (auth type + API key target selectors).
  - Removed native browser prompt/confirm/select usage from `frontend/src` while preserving existing request/environment/auth logic and data flow.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only component refactor; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dropdown-dark-surface-render-fix
- What changed:
  - Updated dropdown panel styling in `frontend/src/components/Dropdown.tsx` to use solid, theme-aware surfaces:
    - Light mode menu panel: `bg-white`.
    - Dark mode menu panel: `dark:bg-slate-900`.
  - Removed translucent/background-blur styling from dropdown panel (no alpha background, no `backdrop-blur`) to prevent washed-out rendering in dark mode.
  - Normalized panel border/shadow for theme consistency:
    - `border border-slate-300` + `dark:border-slate-700`.
    - `shadow-xl` + `dark:shadow-xl`.
  - Set dropdown panel layer to `z-50`.
  - Dropdown behavior/logic (keyboard navigation, selection, portal positioning) remains unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend styling-only change; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update params-headers-input-remount-fix
- What changed:
  - Fixed controlled-input reset behavior in:
    - `frontend/src/components/QueryParamsEditor.tsx`
    - `frontend/src/components/HeaderEditor.tsx`
  - Root cause addressed:
    - Row IDs were derived from mutable key text (`${key}-${index}`) during prop rehydration.
    - On every keystroke, parent `updateRequest` updated `params/headers`, triggering rehydration and regenerating row IDs.
    - Changing React keys caused input rows to remount, leading to one-character typing/reset behavior.
  - Refactor details:
    - Added stable UUID IDs for hydrated rows (`crypto.randomUUID()`), reusing prior IDs by key where possible.
    - Added local-sync guard (`isLocalSyncRef`) to skip immediate prop-rehydration after local edits.
    - Kept updates immutable via functional `setRows(prev => prev.map/filter(...))` patterns.
    - Kept existing UI/styling and request update logic unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only state synchronization fix; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dropdown-mobile-viewport-anchor-stability-fix
- What changed:
  - Refined dropdown viewport anchoring in `frontend/src/components/Dropdown.tsx` while preserving portal + fixed rendering:
    - Menu remains rendered through React Portal to `document.body`.
    - Menu remains `position: fixed`.
    - Anchor coordinates continue to be computed from `triggerRef.getBoundingClientRect()`.
  - Added viewport-safe position recalculation triggers for mobile drift cases:
    - `window.resize`
    - `window.scroll` (capture)
    - `window.visualViewport.resize`
    - `window.visualViewport.scroll`
  - Added `requestAnimationFrame` throttling for position updates to avoid jitter during fast scroll/reflow.
  - Preserved existing dropdown theme/styles and logic (selection, keyboard navigation, portal behavior).
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only positioning update; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dropdown-android-visualviewport-offset-anchor-fix
- What changed:
  - Adjusted fixed-position dropdown anchor math in `frontend/src/components/Dropdown.tsx` to account for visual viewport offsets:
    - `top = rect.bottom + (visualViewport?.offsetTop ?? 0) + 8`
    - `left = rect.left + (visualViewport?.offsetLeft ?? 0)` with viewport-aware clamping.
  - Kept existing architecture unchanged:
    - React Portal rendering to `document.body`
    - `position: fixed` menu
    - `getBoundingClientRect()` trigger anchoring
    - `requestAnimationFrame` throttled position updates
    - resize/scroll/visualViewport event-driven recalculation
  - No theme/styling changes.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only coordinate math fix; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dropdown-android-scroll-jitter-listener-reduction
- What changed:
  - Refined dropdown position update triggers in `frontend/src/components/Dropdown.tsx` to eliminate Android scroll jitter:
    - Removed `window.scroll` position listener.
    - Removed `visualViewport.scroll` position listener.
    - Kept position updates only on:
      - dropdown open
      - `window.resize`
      - `visualViewport.resize`
  - Preserved:
    - React Portal rendering to `document.body`
    - `position: fixed`
    - `getBoundingClientRect()` + visual viewport offset math
    - `requestAnimationFrame` throttling for resize/open recalculation
  - No theme/styling changes.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only listener strategy change; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dropdown-inline-absolute-render-model
- What changed:
  - Refactored `frontend/src/components/Dropdown.tsx` to render menu inline within the trigger tree (removed React Portal usage).
  - Dropdown trigger now lives inside a relative wrapper (`<div className="relative w-full">`), and menu is rendered as:
    - `position: absolute`
    - `top: 100%`
    - `left: 0`
    - `margin-top: 8px` (`mt-2`)
  - Removed viewport anchoring/reposition machinery:
    - Removed anchor coordinate math (`getBoundingClientRect` + visualViewport offsets).
    - Removed `window.scroll` / `window.resize` / `visualViewport` position listeners.
    - Removed RAF-based position recalculation logic.
  - Kept behavior and accessibility:
    - Keyboard navigation (arrow keys, Enter/Space selection, ESC close).
    - Outside click detection via root container ref.
    - Existing theme/styling classes.
  - Desktop behavior remains visually consistent; mobile dropdown now scrolls naturally with page content.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend rendering-model refactor only; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update auth-tab-dropdown-clipping-fix
- What changed:
  - Updated `frontend/src/components/RequestContentTabs.tsx` root tabs container from `overflow-hidden` to `overflow-visible`.
  - This removes clipping for Auth tab dropdown panels (e.g., Auth Type) that are absolutely positioned within tab content.
  - Dropdown component logic and styling were not modified.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend class-only overflow change; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update auth-dropdown-mobile-portal-fixed-render-fix
- What changed:
  - Refactored `frontend/src/components/Dropdown.tsx` back to portal rendering into `document.body` for dropdown menus.
  - Dropdown menu now uses `position: fixed` with trigger-anchored coordinates from `getBoundingClientRect()` and viewport-safe bounds.
  - Added resize-time menu repositioning while open (`window.resize`) and kept keyboard accessibility + outside click detection (including portal menu node).
  - Kept existing dropdown theme/styling classes unchanged.
  - Maintained `overflow-visible` on `frontend/src/components/RequestContentTabs.tsx` to avoid tab-shell clipping.
- Clipping source documentation:
  - The Auth Type menu was clipped by ancestor tab shell containment (`RequestContentTabs` root had `overflow-hidden` before fix).
  - Inline absolute dropdown rendering remained inside that clipped subtree on mobile; portal + fixed escapes ancestor overflow clipping.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only rendering-path change; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update dashboard-mobile-single-scroll-ownership-fix
- What changed:
  - Refined mobile dashboard layout in `frontend/src/pages/Dashboard.tsx` so vertical scroll ownership remains with the document/body path.
  - Mobile frame wrapper now explicitly uses `overflow-y-visible` (no internal vertical scroll ownership).
  - Main dashboard content wrapper now has mobile-specific non-height-owning flow classes (`flex-col`, no `flex-1` on mobile path) to avoid nested scroll container behavior.
  - Replaced loading-state `h-screen` with `min-h-screen`.
  - Desktop layout path and split behavior remain unchanged.
  - `Dropdown` remains portal-rendered with `position: fixed`; no visualViewport offset math or scroll-listener-based re-anchoring is present in `frontend/src/components/Dropdown.tsx`.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only layout ownership refactor; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update mobile-dropdown-scroll-stability-and-sidebar-wrapper-fix
- What changed:
  - Stabilized portal/fixed dropdown behavior on mobile in `frontend/src/components/Dropdown.tsx`:
    - Added mobile-only document scroll close behavior while dropdown is open (capture phase, passive listener).
    - Added mobile-only resize close behavior (instead of reposition), preventing URL-bar/viewport resize drift while scrolling on Android Chrome.
    - Kept portal rendering (`document.body`), `position: fixed`, keyboard access, and theme styling unchanged.
  - Fixed mobile sidebar visual artifact in `frontend/src/pages/Dashboard.tsx`:
    - Removed duplicate mobile transform/transition wrapper behavior around `Sidebar`.
    - Mobile sidebar wrapper now uses a simple `z-30` container; open/close transform is handled only by `Sidebar` itself.
    - Desktop sidebar wrapper transform behavior remains unchanged.
- Root-cause notes:
  - Dropdown instability on mobile was caused by fixed menu staying open during body scroll + dynamic viewport changes; closing on mobile scroll/resize avoids perceived drift without reintroducing scroll-based anchor math.
  - Mobile sidebar transparency/glass artifact was caused by layered transform contexts (Dashboard wrapper + Sidebar fixed transform) in the mobile path.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only event/layout-path adjustments; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.

## Update mobile-tab-switch-top-reset-fix
- What changed:
  - Updated `frontend/src/components/JsonViewer.tsx` to reset mobile tab content to top when switching response tabs (`PRETTY`, `RAW`, `PREVIEW`, `HEADERS`, `HISTORY`).
  - Added mobile-only tab-change effect (`viewMode` + `isMobileViewport`) that:
    - scrolls window to top of JsonViewer root (`window.scrollTo(..., behavior: "auto")`)
    - resets viewer body scroll position to `0`.
  - Added first-render guard so reset runs only on tab changes, not initial mount.
  - Desktop behavior and history/diff logic remain unchanged.
- Schema changes:
  - No table changes.
  - No new indexes.
- New routes:
  - None.
- Performance impact:
  - Frontend-only view-state scroll-position adjustment; no backend or execution hot-path impact.
  - Maintains local target guardrail (`p95(total_internal_ms) < 50ms`) unchanged.
- Migration steps:
  - No migration required.
  - Deploy frontend update.
