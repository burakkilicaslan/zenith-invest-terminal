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

Deployment gate:
- A deployment is not considered complete until it passes UAT review.
- After every successful deployment, the UAT Reviewer / Tester must open the Vercel deployment URL in a browser.
- The reviewer must verify visual alignment with the PRD, check core interactions, and confirm that data loads correctly.
- If the deployed build fails any check, the reviewer must document the issue with clear reproduction steps and send it back for Devin to fix before the deployment is accepted.
- Keep this gate mandatory for every future deployment.
