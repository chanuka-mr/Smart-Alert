Developer setup notes
=====================

This project runs a local backend (Node/Express) and a frontend (Create React App) during development.

Goals
- Ensure the backend uses a stable port so the CRA dev server proxy can forward API calls reliably.
- Avoid confusing automatic port fallback behavior during development.

Backend
- The backend reads `PORT` from `BACKEND/.env` or the environment. By default it's `5000`.
- If you want the backend to fail fast when the port is taken (recommended for development), set `STRICT_PORT=true` in `BACKEND/.env`.

Examples
- Start backend (from repository root):

```powershell
cd BACKEND
npm install
npm start
```

Frontend
- The frontend uses CRA. The `frontend/package.json` `proxy` field should point to the backend port (e.g., `http://localhost:5000`).
- Start frontend:

```powershell
cd frontend
npm install
npm start
```

If the frontend cannot bind 3000 (port already used) it will offer an alternate port (3001). If you want 3000 specifically, stop the process that holds 3000 before starting CRA.

Troubleshooting
- If you see ECONNREFUSED from CRA when it proxies to `/auth/login` or similar, verify:
  - Backend is running and listening on configured `PORT`.
  - `frontend/package.json` `proxy` matches backend port.
  - No other process is occupying the backend port.
