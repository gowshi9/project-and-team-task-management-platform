# CI/CD Workflow Explanation

TeamFlow uses **GitHub Actions** defined in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Triggers

- Push to `main` / `master`
- Pull requests

## Jobs

### 1. Backend

Working directory: `backend/`

1. Checkout repository
2. Setup Node.js 20 with npm cache
3. `npm ci`
4. `npx prisma generate` – generate Prisma Client
5. `npx prisma validate` – validate schema
6. `npm run lint` – TypeScript typecheck (`tsc --noEmit`)
7. `npm test` – Vitest unit tests (validators / helpers)
8. `npm run build` – compile TypeScript to `dist/`

### 2. Frontend

Working directory: `frontend/`

1. Checkout repository
2. Setup Node.js 20 with npm cache
3. `npm ci`
4. `npm run lint` – ESLint
5. `npm run build` – Next.js production build

## Why this pipeline

It catches type errors, schema mistakes, broken unit tests, and frontend build failures before merge—matching the evaluation criteria for basic testing and CI/CD without requiring a live database in CI.
