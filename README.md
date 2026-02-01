<p align="center">
  <img src="frontend/public/assets/reqflow-logo.png" alt="ReqFlow Banner" width="180" />
</p>

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Express.js-4.x-black?logo=express&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/OAuth-2.0-EB5424?logo=oauth&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?logo=nginx&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Swagger-API_Docs-85EA2D?logo=swagger&logoColor=white&style=for-the-badge" />
</p>

![Release](https://img.shields.io/github/v/release/ReqFlowHQ/ReqFlow)
![License](https://img.shields.io/github/license/ReqFlowHQ/ReqFlow)
![Stars](https://img.shields.io/github/stars/ReqFlowHQ/ReqFlow?style=social)

---

Released as v1.0.0 · Actively maintained

# ReqFlow — API Testing & Request Workflow Platform

ReqFlow is a modern **API testing and request workflow platform** for developers
who want clarity, speed, and control when working with APIs.

It is a clean, container-ready alternative to tools like Postman, designed around
structured request management, authentication workflows, and Docker-based deployment.

This is the official **ReqFlow repository**, developed and maintained by the **ReqFlow** team.

🔗 Live Platform: https://reqflow.onlineappsandservices.online

---

## Why ReqFlow?

- Designed around workflows, not just raw requests  
- Clean separation of frontend, backend, and infrastructure  
- First-class authentication handling (OAuth + JWT)  
- Container-ready from day one  
- Open-source and developer-first

---

# Key Features

### Upcoming Feature: Engineer Mode  
A dedicated workspace designed for power users.  
Engineer Mode introduces an animated “wave” interaction that transforms the UI theme as it flows across the screen.  
Along with the visual unlock, this mode will enable advanced capabilities such as:

- AI-assisted request generation  
- Intelligent workflow chaining  
- Automated testing sequences  
- Smart suggestions for headers, params, and auth flows  

This feature is currently in development and will be introduced in an upcoming release.

---

### Authentication
- OAuth 2.0 login support  
- JWT access tokens + refresh tokens  
- Protected API routes  
- Email verification flow  

### Frontend Workspace
- Request editor (headers, body, params)  
- JSON response viewer  
- Multiple tabs for switching between requests  
- Collection-based organization  
- Drag-to-resize split view  
- Light/dark themes  
- Glassmorphic UI styling  

### Backend API
- Express + TypeScript  
- Passport OAuth integration  
- Database models for collections, requests, tokens, and users  
- Request execution utility  
- Email templates for verification  
- Swagger documentation  
- Clean controllers + route separation  

### Dockerized Architecture
Everything runs in containers:
- Frontend served through **Nginx**  
- Backend runs on **Node.js**  
- Shared network via `docker-compose`  
- One-command deployment  

### Architecture (High Level)

Frontend (React + Vite) communicates with a Node.js + Express backend.
Authentication is handled via OAuth 2.0 and JWT.
Guest users are rate-limited using IP + User-Agent fingerprinting.
MongoDB is used for persistence.

---

# Project Structure

> 📁 This is the full repository structure as of the latest release.
> The canonical source of truth is `structure.txt`.

```text
├── backend
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── src
│   │   ├── config
│   │   │   └── db.ts
│   │   ├── controllers
│   │   │   ├── authController.ts
│   │   │   ├── collectionController.ts
│   │   │   ├── requestController.ts
│   │   │   └── runtimeController.ts
│   │   ├── db.ts
│   │   ├── index.ts
│   │   ├── middleware
│   │   │   ├── attachUser.ts
│   │   │   ├── auth.ts
│   │   │   ├── guest.ts
│   │   │   └── protectOptional.ts
│   │   ├── models
│   │   │   ├── Collection.ts
│   │   │   ├── GuestUsage.ts
│   │   │   ├── RefreshToken.ts
│   │   │   ├── Request.ts
│   │   │   └── User.ts
│   │   ├── passport.ts
│   │   ├── routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── collectionRoutes.ts
│   │   │   ├── guestRoutes.ts
│   │   │   ├── requestRoutes.ts
│   │   │   └── runtimeRoutes.ts
│   │   ├── swagger.json
│   │   ├── types
│   │   │   ├── express.d.ts
│   │   │   └── globals.d.ts
│   │   └── utils
│   │       ├── emailTemplates.ts
│   │       ├── executeRequest.ts
│   │       ├── generateToken.ts
│   │       └── sendEmail.ts
│   ├── swagger.json
│   └── tsconfig.json
├── deploy.sh
├── docker-compose.yml
├── frontend
│   ├── cloudflared.deb
│   ├── Dockerfile
│   ├── favicon
│   │   ├── android-icon-144x144.png
│   │   ├── android-icon-192x192.png
│   │   ├── android-icon-36x36.png
│   │   ├── android-icon-48x48.png
│   │   ├── android-icon-72x72.png
│   │   ├── android-icon-96x96.png
│   │   ├── apple-icon-114x114.png
│   │   ├── apple-icon-120x120.png
│   │   ├── apple-icon-144x144.png
│   │   ├── apple-icon-152x152.png
│   │   ├── apple-icon-180x180.png
│   │   ├── apple-icon-57x57.png
│   │   ├── apple-icon-60x60.png
│   │   ├── apple-icon-72x72.png
│   │   ├── apple-icon-76x76.png
│   │   ├── apple-icon.png
│   │   ├── apple-icon-precomposed.png
│   │   ├── browserconfig.xml
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon-96x96.png
│   │   ├── favicon.ico
│   │   ├── labs.png
│   │   ├── manifest.json
│   │   ├── ms-icon-144x144.png
│   │   ├── ms-icon-150x150.png
│   │   ├── ms-icon-310x310.png
│   │   └── ms-icon-70x70.png
│   ├── favicon.png
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── public
│   │   ├── assets
│   │   │   └── reqflow-logo.png
│   │   ├── og-preview.png
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   ├── server.cjs
│   ├── src
│   │   ├── api
│   │   │   └── axios.ts
│   │   ├── App.tsx
│   │   ├── assets
│   │   │   ├── dashboard-preview.png
│   │   │   └── og-preview.png
│   │   ├── components
│   │   │   ├── AppLoader.tsx
│   │   │   ├── BodyEditor.tsx
│   │   │   ├── HeaderEditor.tsx
│   │   │   ├── JsonViewer.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   ├── ReqFlowLogo.tsx
│   │   │   ├── RequestContentTabs.tsx
│   │   │   ├── RequestEditor.tsx
│   │   │   ├── RequestTabs.tsx
│   │   │   ├── Reveal.tsx
│   │   │   ├── RouteTransition.tsx
│   │   │   ├── SafeLink.tsx
│   │   │   ├── ScrollToTop.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   ├── context
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks
│   │   │   ├── usePreventBack.ts
│   │   │   └── useRequests.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── About.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Maintenance.tsx
│   │   │   ├── Privacy.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Terms.tsx
│   │   │   └── VerifyEmail.tsx
│   │   ├── tailwind.css
│   │   └── vite-env.d.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
├── RELEASENOTES.md
└── structure.txt

21 directories, 121 files
```

---

# Tech Stack

**Frontend**
- React 18  
- TypeScript  
- Vite  
- TailwindCSS  
- Axios  

**Backend**
- Node.js  
- Express  
- TypeScript  
- Passport OAuth2  
- MongoDB  
- Mongoose  
- JWT  

**DevOps**
- Docker  
- Docker Compose  
- Nginx reverse proxy  
- Swagger API Docs  

---

## Running with Docker

Everything can be started with one command:

```bash
docker-compose up --build
```
- Frontend → http://localhost:3000
- Backend → http://localhost:5000

Both services communicate inside the Docker network automatically.

## Local Development (Without Docker)

Install deps:

```bash
cd frontend && npm install
cd backend && npm install
```
- Run frontend:

```bash
npm run dev
```
- Run backend:

```bash
npm run dev
```
# OAuth2 Flow

- User chooses OAuth provider (Google, etc.)
- Provider redirects to backend callback
- Backend verifies identity and generates tokens
- Frontend receives JWT → stores in session
- AuthContext manages session state
- This removes the need for password-based login and keeps things secure.

# API Documentation

- Swagger JSON is generated at:

```bash
backend/src/swagger.json
```
- Swagger UI available at:

```bash
/api/docs
```
# Contributing

Contributions are welcome!
If you find something to improve, feel free to open an issue or submit a PR.

# License

MIT License
