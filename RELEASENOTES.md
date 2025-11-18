# Release Notes

## Version 1.0.0 – Initial Production Release

### Core Features
- User authentication and authorization protecting API request routes.
- CRUD operations for API requests associated with user accounts and organized by collections.
- Execute saved requests with automatic saving and detailed server response capture.
- Execute temporary (unsaved) requests with full support for HTTP methods.
- Proxy route to safely execute arbitrary requests and avoid CORS errors.

### Response Management
- Content-type based response handling (JSON, HTML, plain text).
- Conversion of response headers to normalized plain JS objects.
- Measurement and display of response time (ping) for saved requests saved in backend.
- Client-side measurement and display of response time for temporary requests.

### Validation & Error Handling
- Backend validation for required fields (e.g., URL must be non-empty string).
- Frontend validation requiring collection selection before saving requests.
- Clear, propagated error messages from backend to frontend.
- UI toast notifications for success and failure in saving and executing requests.

### Usability Enhancements
- Loading UI states during async operations.
- Separate pathways for temporary and persistent requests in the application.
- Consistent toast notifications for user feedback.
- Normalized headers and response formatting improve data presentation.

### Technical Improvements
- TypeScript usage for type safety and better dev experience.
- Modular separation of concerns in backend and frontend code.
- Proper augmentation for global typings for UI utilities.
- Robust error propagation and handling in async functions.

---

This release delivers a robust, secure, and user-friendly API testing and management application supporting full request lifecycle, validated inputs, clear user feedback, and performance metrics.
