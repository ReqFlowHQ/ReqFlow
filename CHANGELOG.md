# Changelog

All notable changes to ReqFlow will be documented in this file.

---

## [v1.0.1] – 2026-02-01

### Fixed
- Fixed a mobile-only sidebar issue where the collections header, create input, and action buttons could disappear after sending a request and auto-scrolling to the response.
- Improved sidebar layout stability on mobile devices by isolating scroll behavior to the collections list.

### Notes
- Desktop behavior remains unchanged.
- No API, backend, or request execution logic was affected.

---

## [v1.0.2] – 2026-02-01

### Fixed
- Fixed guest request quota not decrementing for empty or invalid request executions.
- Ensured guest request quota remains fully synchronized between backend and frontend.
- Prevented guest request execution after quota exhaustion.
- Resolved an issue where the guest quota UI could skip remaining values (e.g. 5 → 3).

### Notes
- Guest quota is now decremented on every execution attempt, regardless of request validity.
- Backend remains the source of truth for quota state.
