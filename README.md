# Inventory Management System

A single-admin, mobile-first inventory management system with live stock sync across devices.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, TanStack Query v5, Socket.IO client
- **Backend:** NestJS 11, Node.js 24 LTS, Socket.IO 4, JWT, Nodemailer
- **Database:** MongoDB 8 + Mongoose 8
- **Validation:** Zod 3 (shared package)
- **Package Manager:** pnpm 10 (workspace monorepo)
- **Deployment:** Ubuntu VPS + Nginx + PM2 + Let's Encrypt

## Structure

\`\`\`
apps/
  api/        → NestJS backend
  web/        → Next.js frontend
packages/
  types/      → Shared TypeScript types
  validation/ → Shared Zod schemas
\`\`\`

## Prerequisites

- Node.js >= 24
- pnpm >= 10
- MongoDB 8 running locally or via Docker

## Setup

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Copy env files
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# 3. Edit the .env files with your values

# 4. Seed admin user (first time only)
pnpm seed:admin

# 5. Run dev servers (api + web in parallel)
pnpm dev
\`\`\`

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000/api

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run api + web in parallel |
| `pnpm build` | Build all packages + apps |
| `pnpm lint` | Lint everything |
| `pnpm format` | Format everything with prettier |
| `pnpm typecheck` | TypeScript check all |
| `pnpm clean` | Remove node_modules + build artifacts |
| `pnpm seed:admin` | Create admin user (uses env vars) |