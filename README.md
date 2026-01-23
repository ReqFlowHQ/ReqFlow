<p align="center">
  <img src="frontend/favicon/labs.png" alt="ReqFlow Banner" />
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

---

# ReqFlow — Modern, Container-Ready API Testing Workspace

ReqFlow is a product of OpenGraph Labs, where we build tools that simplify a developer’s day-to-day workflow.

ReqFlow is designed as a modern alternative to cluttered API clients—clean UI, structured request management, secure backend architecture, and effortless deployment with Docker and Nginx.

Our team focuses on crafting developer experiences that feel intuitive, fast, and scalable.

**OpenGraph Labs — "Tools for developers, built by developers"**

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

```text
backend/
├─ src/
│  ├─ config/
│  ├─ controllers/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ types/
│  ├─ utils/
│  ├─ db.ts
│  ├─ index.ts
│  ├─ passport.ts
│  └─ swagger.json
├─ Dockerfile
├─ package.json
└─ tsconfig.json

frontend/
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ context/
│  ├─ hooks/
│  ├─ pages/
│  ├─ App.tsx
│  └─ main.tsx
├─ Dockerfile
├─ index.html
└─ tailwind.config.js

.gitignore
docker-compose.yml
LICENSE
RELEASENOTES.md
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
