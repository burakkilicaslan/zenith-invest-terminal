# Architecture foundation

Stack:
- Frontend: Next.js with TypeScript
- Backend: FastAPI with Python
- Data/auth/storage: Supabase

Rules:
- Mock-first: every external dependency must have a local mock or stub before real integration.
- Keep frontend, backend, and shared concerns separated.
- Prefer small, explicit modules and simple interfaces.

Initial repository shape:
- frontend/ for the Next.js app
- backend/ for the FastAPI app
- shared/ for shared artifacts and contracts
- docs/ for architecture and workflow notes
