<p align="center">
  <img src="https://api.apiflash.com/v1/urltoimage?access_key=demo&url=https://dummyimage.com/1200x300/1a1a1a/ffffff&text=REQFLOW:+Modern+API+Testing+Workspace" alt="ReqFlow Banner" />
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

# ⚡ ReqFlow — Modern, Container-Ready API Testing Workspace

ReqFlow is a full-stack API testing and request-management tool designed for developers who want a clean workflow without the clutter.  
You get a smooth React + TypeScript UI, a strong Express backend, OAuth2 support, email verification, an in-browser request editor, and a fully containerized setup using Docker and Nginx.

The goal is simple: make daily API testing fast, organized, and actually pleasant to use.

---

# ✨ Key Features

### 🔐 Authentication
- OAuth 2.0 login support  
- JWT access tokens + refresh tokens  
- Protected API routes  
- Email verification flow  

### 🖥️ Frontend Workspace
- Request editor (headers, body, params)  
- JSON response viewer  
- Multiple tabs for switching between requests  
- Collection-based organization  
- Drag-to-resize split view  
- Light/dark themes  
- Glassmorphic UI styling  

### 🧩 Backend API
- Express + TypeScript  
- Passport OAuth integration  
- Database models for collections, requests, tokens, and users  
- Request execution utility  
- Email templates for verification  
- Swagger documentation  
- Clean controllers + route separation  

### 🐳 Dockerized Architecture
Everything runs in containers:
- Frontend served through **Nginx**  
- Backend runs on **Node.js**  
- Shared network via `docker-compose`  
- One-command deployment  

---

# 🧱 Project Structure

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

# 🛠️ Tech Stack

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

# 🐳 Running with Docker

Everything can be started with one command:

```bash
docker-compose up --build
Frontend → http://localhost:5173

Backend → http://localhost:5000

Both services communicate inside the Docker network automatically.

🧪 Local Development (Without Docker)
Install deps:

bash
Copy code
cd frontend && npm install
cd backend && npm install
Run frontend:

bash
Copy code
npm run dev
Run backend:

bash
Copy code
npm run dev

🔐 OAuth2 Flow
User chooses OAuth provider (Google, etc.)

Provider redirects to backend callback

Backend verifies identity and generates tokens

Frontend receives JWT → stores in session

AuthContext manages session state

This removes the need for password-based login and keeps things secure.

📄 API Documentation
Swagger JSON is generated at:

bash
Copy code
backend/src/swagger.json

Swagger UI available at:

bash
Copy code
/api/docs

🤝 Contributing
Contributions are welcome!
If you find something to improve, feel free to open an issue or submit a PR.

📜 License
MIT License
