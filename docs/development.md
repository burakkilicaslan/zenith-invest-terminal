# Development workflow

Local setup expectations:
- Frontend runs as a Next.js app with TypeScript.
- Backend runs as a FastAPI app with Python.
- Configuration comes from environment variables copied from .env.example.
- Development must work with mock services before real integrations are enabled.

Quality gates:
- Formatting should be consistent across frontend and backend.
- Linting should catch obvious mistakes before review.
- Minimal tests should cover the foundation and contract surfaces.

Suggested scripts:
- start frontend
- start backend
- run format checks
- run lint checks
- run tests
