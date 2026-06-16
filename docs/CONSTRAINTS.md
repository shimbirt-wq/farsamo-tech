# Constraints

## Architecture Constraints

- Preserve a clear separation between frontend, backend API, and database layers.
- Use one Next.js full-stack application rather than separate frontend and Express backend projects.
- Keep business rules in route handlers, server actions, or server-only modules, not in client-only logic.
- Use Prisma as the only direct application access layer for Supabase PostgreSQL.
- Use role-based authorization for all sensitive routes.
- Keep repair ticket status transitions controlled and auditable.
- Avoid adding Phase 2 features before the MVP workflows are stable.

## TypeScript Constraints

- Use strict TypeScript for frontend and backend implementation.
- Avoid `any` unless there is a documented integration boundary.
- Prefer explicit request and response types.
- Keep functions focused and readable.

## Data Constraints

- `email` should be unique.
- `university_id` should be unique where available.
- `ticket_id` should be unique and human-readable.
- `serial_number` should be stored when provided, but some devices may not have one.
- Repair tickets must always belong to a registered device.
- Devices must always belong to a user.
- Repair logs must always belong to a repair ticket.

## Validation Constraints

Required registration fields:

- Full name
- University ID
- Faculty
- Department
- Phone number
- Email

Required repair request fields:

- Device type
- Brand
- Model
- Serial number, when available
- Problem description

Optional repair request fields:

- Photo upload

## Security Constraints

- Never expose secrets in source control.
- Hash passwords before storage.
- Validate all request bodies.
- Sanitize user-generated text such as issue descriptions, diagnosis notes, and repair notes.
- Validate file uploads by size and type.
- Prevent users from reading or modifying tickets they do not own.
- Prevent technicians from updating tickets not assigned to them unless an admin grants access.
- Restrict analytics and performance reports to admin users unless explicitly approved.

## Frontend Constraints

- Reuse shared UI components once the design system exists.
- Preserve responsive behavior for mobile and desktop users.
- Keep dashboards scan-friendly and role-specific.
- Use accessible labels for forms, buttons, status indicators, and timelines.
- Avoid excessive gradients, glassmorphism, and generic decorative layouts.
- Status timelines should be visually clear without relying only on color.

## Notification Constraints

- MVP must support dashboard notifications.
- Email can be included in MVP if SMTP or provider credentials are available.
- SMS and WhatsApp are Phase 2 unless explicitly prioritized.
- Notifications should be triggered by repair journey events, not manually duplicated across modules.

## Reporting Constraints

- Reports must be based on database records, not hardcoded demo values.
- Analytics should support filtering by date range when implementation begins.
- Technician rankings must use transparent metrics such as completed repairs and average repair time.
- Reports should avoid exposing unnecessary personal data.

## Deployment Constraints

- Frontend and backend should be deployable independently.
- Production secrets must be configured through hosting provider secret management.
- Database migrations must be repeatable.
- Deployment should include health checks for the backend API.

## Future Scope Constraints

The following should remain out of MVP unless explicitly approved:

- Mobile application
- AI issue classification
- Inventory management
- WhatsApp notifications
- Student portal integration
- Advanced recognition campaigns
- Multi-campus support
