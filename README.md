# Vismaya Casting Platform — Monorepo

Welcome to the **Vismaya Casting Platform** monorepo. This repository contains both the Next.js Web Frontend and the Node.js/Express REST API backend for the Vismaya creative talent casting and recruitment platform.

---

## 📁 Repository Structure

```text
vismaya/
├── frontend/                  # Next.js 16 (React 19) Web Application
│   ├── app/                   # Next.js App Router (Public, Talent, Recruiter, Admin)
│   ├── components/            # UI components (GoogleAuthButton, Modals, Forms)
│   ├── context/               # Global state (Auth, RecruiterContext, Toasts)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # API clients, mocks, and domain helpers
│   ├── public/                # Static assets, branding, and icons
│   ├── .env.example           # Frontend environment variable template
│   ├── package.json           # Frontend scripts & dependencies
│   └── next.config.mjs        # Next.js configuration
│
├── backend/                   # Node.js / Express / MongoDB REST API
│   ├── src/
│   │   ├── controllers/       # Route controllers (Auth, Opportunity, Credit, etc.)
│   │   ├── models/            # Mongoose data models
│   │   ├── routes/            # Express router modules (/api/...)
│   │   ├── services/          # Business logic, Cloudinary, Razorpay, Notifications
│   │   ├── middleware/        # Auth, CORS, Helmet, Rate limiting, Uploads
│   │   ├── config/            # Database and service configs
│   │   └── app.js             # Express application setup
│   ├── scripts/               # DB seeders and administrative scripts
│   ├── tests/                 # Jest integration and security tests
│   ├── server.js              # Server entry point (starts on port 5000)
│   ├── .env.example           # Backend environment variable template
│   └── package.json           # Backend scripts & dependencies
│
├── docs/                      # Centralized Project Documentation
│   ├── API_BLUEPRINT.md       # Complete API blueprint & endpoint contracts
│   ├── API_GUIDE_EASY.md      # Simplified integration guide for developers
│   ├── GOOGLE_AUTH_BACKEND_TODO.md  # Google OAuth backend verification guide
│   ├── PAYMENTS_BACKEND_TODO.md     # Razorpay backend webhook & fulfillment guide
│   ├── theme/                 # Design system tokens and styling progress
│   └── qa/                    # Testing artifacts and screenshots
│
├── package.json               # Root monorepo script runner (private)
├── render.yaml                # Render Infrastructure-as-Code Blueprint
├── .gitignore                 # Root Git ignore rules
├── .editorconfig              # Code formatting guidelines across editors
├── .nvmrc                     # Recommended Node.js version (20+)
└── README.md                  # Project overview and developer onboarding
```

---

## ⚡ Prerequisites

- **Node.js**: `v20.x` or `v22.x` (check with `node -v`; `.nvmrc` is included).
- **npm**: `v10.x` or higher (check with `npm -v`).
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas cluster URI.

---

## 🚀 First-Time Setup

1. **Install All Dependencies**:
   From the monorepo root, run:
   ```bash
   npm run install:all
   ```
   *(This cleanly installs dependencies inside both `frontend/` and `backend/` independently without mixing package trees).*

2. **Configure Environment Variables**:
   Copy the example templates in both folders:

   ```bash
   # On Windows (PowerShell):
   copy frontend\.env.example frontend\.env.local
   copy backend\.env.example backend\.env

   # On macOS / Linux:
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

   - In `backend/.env`: Provide your `MONGODB_URI` and a secure `JWT_SECRET` (minimum 32 characters).
   - In `frontend/.env.local`: Default settings run in **Mock Mode** (`NEXT_PUBLIC_USE_MOCK=true`) so you can explore the frontend immediately without a database.

---

## 💻 Running Development Servers

Open two terminal tabs from the monorepo root:

### Terminal 1: Backend API
```bash
npm run dev:backend
```
- Runs Express on **`http://localhost:5000`** with nodemon auto-reload.
- Health check available at `http://localhost:5000/api/health`.

### Terminal 2: Frontend Web App
```bash
npm run dev:frontend
```
- Runs Next.js on **`http://localhost:3000`** with Turbopack fast refresh.
- Access the web application at `http://localhost:3000`.

---

## 🔄 Mock Mode vs Real Backend Mode

The frontend includes an isolated mock data layer so it can be previewed or tested offline:

| Mode | `.env.local` Setting | Description |
| :--- | :--- | :--- |
| **Full Mock Mode (Default)** | `NEXT_PUBLIC_USE_MOCK=true` | Uses local storage & mock seed data. No backend or MongoDB required. |
| **Real Backend Mode** | `NEXT_PUBLIC_USE_MOCK=false`<br>`NEXT_PUBLIC_API_MODULES=*` | Connects all frontend requests to the live backend on `http://localhost:5000`. |
| **Selective Hybrid Mode** | `NEXT_PUBLIC_USE_MOCK=false`<br>`NEXT_PUBLIC_API_MODULES=auth,public` | Only `auth` and `public` hit live backend; remaining modules stay in mock. |

---

## 🏗️ Root Scripts Reference

All commands can be executed directly from the root directory:

| Command | Action |
| :--- | :--- |
| `npm run install:all` | Installs dependencies in both `frontend/` and `backend/`. |
| `npm run dev:frontend` | Starts the Next.js development server on port 3000. |
| `npm run dev:backend` | Starts the Express development server on port 5000. |
| `npm run build:frontend` | Creates an optimized production build of Next.js. |
| `npm run start:frontend` | Starts the Next.js production server. |
| `npm run start:backend` | Starts the Express server using `node server.js`. |

---

## ☁️ Deployment (Render Blueprint)

The repository includes a ready-to-use [`render.yaml`](render.yaml) configuration deploying two connected services:

1. **`vismaya-frontend`** (Web Service, Node runtime):
   - Root Directory: `frontend`
   - Build: `npm install && npm run build`
   - Start: `npm run start`
   - Environment: `NEXT_PUBLIC_API_URL` pointing to the backend Render URL.

2. **`vismaya-backend`** (Web Service, Node runtime):
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm run start`
   - Health Check Path: `/api/health`
   - Environment: Database credentials, `CORS_ORIGIN`, and Razorpay/Cloudinary keys.

---

## 🌿 Git Workflow & Commit Guidelines

Both frontend and backend live in this single repository. To keep history clear and searchable, use conventional commit prefixes:

- `feat(frontend): add Google authentication button`
- `feat(backend): implement Razorpay webhook verification`
- `fix(frontend): adjust mobile layout on opportunities page`
- `fix(backend): correct CORS allowed headers`
- `docs: update API blueprint documentation`
- `chore: update root monorepo scripts`

---

## ⚠️ Common Troubleshooting

1. **CORS Policy Violation**:
   - Backend restricts cross-origin requests. Ensure `CORS_ORIGIN` in `backend/.env` contains your frontend address (e.g. `http://localhost:3000`).
2. **Next.js Environment Variables Not Updating**:
   - Variables prefixed with `NEXT_PUBLIC_*` are baked into bundle files during `build`. When changing `NEXT_PUBLIC_*` variables, restart the development server or rerun `npm run build`.
3. **Port 5000 or 3000 Already in Use**:
   - Check if an existing server process is running:
     ```powershell
     # Windows PowerShell:
     Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
     ```
4. **Backend Fails with "FATAL CONFIGURATION ERROR"**:
   - Backend enforces security on startup. In non-test environments, `MONGODB_URI` and `JWT_SECRET` must be set and cannot use insecure defaults.
