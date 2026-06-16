# Project Setup

## Recommended Stack

### Full-Stack Application

- Next.js App Router
- TypeScript
- React Server Components where practical
- Route Handlers for backend API endpoints
- Server Actions where they simplify form workflows
- Tailwind CSS for styling

### Database

- Supabase PostgreSQL
- Prisma ORM
- Prisma migrations for schema changes

### Authentication

- JWT-based authentication
- Role-based authorization
- Secure HTTP-only cookies for browser sessions

### Hosting

- Application: Vercel
- Database: Supabase PostgreSQL

## Suggested Repository Structure

```text
farsamotech/
  docs/
    ARCHITECTURE.md
    CONSTRAINTS.md
    PROJECT_DEFINITION.md
    PROJECT_SETUP.md
  prisma/
    schema.prisma
    migrations/
  src/
    app/
      api/
      dashboard/
      globals.css
      layout.tsx
      page.tsx
    components/
      ui/
      layout/
      forms/
    features/
      auth/
      users/
      devices/
      tickets/
      repair-logs/
      notifications/
      analytics/
      admin/
    lib/
      auth/
      db/
      validations/
      constants/
      utils/
    types/
  .env.example
  next.config.ts
  package.json
  tsconfig.json
  README.md
```

## Application Direction

Use one Next.js TypeScript codebase for both frontend and backend behavior.

- UI pages live in `src/app`.
- Backend endpoints live in `src/app/api`.
- Shared server-side business logic lives in `src/lib`.
- Domain-specific UI and logic live in `src/features`.
- Prisma schema and migrations live in `prisma`.

## Recommended Feature Areas

- `auth`
- `users`
- `devices`
- `tickets`
- `repair-logs`
- `technician-activity`
- `notifications`
- `analytics`
- `admin`

## Backend Direction in Next.js

Use Next.js Route Handlers instead of a separate Express server.

Recommended API areas:

- `src/app/api/auth`
- `src/app/api/users`
- `src/app/api/devices`
- `src/app/api/repair-tickets`
- `src/app/api/repair-logs`
- `src/app/api/notifications`
- `src/app/api/reports`

Keep validation, authorization, and Prisma access outside route files where possible. Route handlers should stay thin and call focused server-side functions.

## Environment Variables

```text
NODE_ENV=
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
NEXT_PUBLIC_APP_URL=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
UPLOAD_MAX_SIZE_MB=
```

For Supabase:

- `DATABASE_URL` should use the Supabase pooled connection for application runtime.
- `DIRECT_URL` should use the direct database connection for Prisma migrations.

Do not commit real secrets. Use local `.env` files for development and Vercel/Supabase secret management in production.

## Setup Sequence

1. Initialize the Next.js TypeScript application.
2. Configure Tailwind CSS and shared styling.
3. Configure Prisma with Supabase PostgreSQL.
4. Define database models and enums in `prisma/schema.prisma`.
5. Generate the Prisma client.
6. Create authentication and role authorization helpers.
7. Implement user, device, repair ticket, and repair log modules.
8. Add technician assignment and repair journey updates.
9. Add admin dashboard APIs and analytics queries.
10. Add dashboard notifications and email integration.
11. Add tests for validation, authorization, and ticket lifecycle behavior.
12. Configure Vercel deployment and Supabase production environment variables.

## Development Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npx prisma generate
npx prisma migrate dev
```

## Development Quality Checks

Before finalizing implementation changes:

- Run TypeScript checks
- Run linting
- Run Prisma schema validation
- Verify role-based access behavior
- Verify repair status transitions
- Verify upload validation
- Verify dashboard and analytics queries against realistic data
