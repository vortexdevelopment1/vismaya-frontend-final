# Vismaya Backend (TypeScript / Express / MongoDB)

Vismaya Casting Platform REST API backend built in TypeScript (strict mode, ES2022) running on native **ES Modules** (`"type": "module"`, `NodeNext` resolution with explicit `.js` extensions on all relative imports).

## 🚀 TypeScript Commands

Run all backend commands from within the `backend/` directory (or use root monorepo scripts):

```bash
# 1. Development mode (with fast tsx watch and live auto-reload)
npm run dev

# 2. Type-checking (verifies all types without emitting JS)
npm run typecheck

# 3. Production build (compiles src/ TypeScript to dist/ using tsc)
npm run build

# 4. Production start (executes compiled dist/server.js)
npm run start
```

## 📁 Source Layout

- `src/config/`: Typed environment config (`env.ts`), database (`database.ts`), and external SDK setup.
- `src/types/`: Global TypeScript interfaces (`index.ts`) and Express declaration extensions (`express.d.ts`).
- `src/models/`: Mongoose schemas and typed document interfaces (`IUser`, `IOpportunity`, `ITalentProfile`, etc.).
- `src/controllers/`: Express route handlers with Request/Response typing.
- `src/routes/`: Router modules with Express route definitions.
- `src/middleware/`: Auth, role verification, rate limiters, upload handlers, and error handlers.
- `src/services/`: Business services (notifications, sessions, audits, external integrations).
- `src/utils/`: Common helpers, sanitizers, and scoring calculators.
- `src/jobs/`: Background cron jobs (deadline checker, cancellation sweeps).
- `src/app.ts`: Express application setup and middleware pipeline.
- `src/server.ts`: HTTP server entry point and lifecycle management.
