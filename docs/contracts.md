# Architecture contracts

Frontend/backend boundary:
- Next.js frontend consumes a typed API client layer.
- FastAPI backend owns request validation and business rules.
- Shared contracts live in a dedicated location and are treated as the source of truth for request/response shapes.

Mock-first approach:
- Define local mocks or stubs for all external dependencies before wiring real services.
- Keep uncertain integrations documented as placeholders until the contract is stable.

Supabase assumptions:
- Supabase is the first-choice platform for auth, database, and storage.
- Integration points should remain explicit and thin.
- No business logic should depend on an untyped external response shape.
