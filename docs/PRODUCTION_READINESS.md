# Production Readiness Checklist

Use this checklist before deploying the V2 service-desk release to production.

## Environment And Secrets

- [ ] `DATABASE_URL` is configured with the production pooled PostgreSQL connection string.
- [ ] `DIRECT_URL` is configured with the production direct PostgreSQL connection string for migrations.
- [ ] `JWT_SECRET` is set, random, and at least 32 characters.
- [ ] `NEXT_PUBLIC_APP_URL` points to the canonical production URL.
- [ ] Upload configuration is set: `UPLOAD_MAX_SIZE_MB`, `UPLOAD_BUCKET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` when storage uploads are enabled.
- [ ] No production secrets are committed to source control.
- [ ] Vercel or hosting environment uses server-only secrets for private values.

## Database And Migrations

- [ ] `npx prisma validate` passes.
- [ ] `npx prisma migrate status` shows no pending local migrations for the target database.
- [ ] Production migration plan uses `npx prisma migrate deploy`, not `migrate dev`.
- [ ] Database backup exists before applying migrations.
- [ ] Rollback plan is documented for migration or deploy failure.
- [ ] V2 schema additions are confirmed additive and do not drop existing student/account data.
- [ ] Existing ticket IDs and tracking codes remain queryable after migration.

## Build And Verification

- [ ] `npm run typecheck` passes.
- [ ] `npm run test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `/api/health` returns a healthy response in the deployed environment.
- [ ] A preview deployment has been smoke-tested before production promotion.

## Authentication And Authorization

- [ ] HTTP-only session cookies are used.
- [ ] Secure cookies are enabled when `NODE_ENV=production`.
- [ ] Inactive users are blocked from API and server-rendered app pages.
- [ ] `ADMIN` can access admin users, admin devices, lead command, technician workspace, and service-desk reports.
- [ ] `LEAD_TECHNICIAN` can access lead command, technician workspace, custody management, and service-desk reports.
- [ ] `TECHNICIAN` can access only assigned technician workspace operations and cannot access lead/admin reports.
- [ ] Public routes do not require login but return only public-safe data.

## Privacy And Data Exposure

- [ ] Public tracking does not expose requester phone, requester email, internal notes, triage notes, repair notes, custody photos, storage location, pickup hash, or staff-only metadata.
- [ ] Public repair request responses do not expose internal ticket fields.
- [ ] Service-desk reports do not expose requester contact data, pickup hash, custody photos, internal notes, or password hashes.
- [ ] Custody storage location is visible only to authorized internal staff views.
- [ ] Technician views only expose assigned-ticket details to regular technicians.
- [ ] Lead/admin views expose requester contact only where operationally required.

## Service Desk Workflow

- [ ] Public request creation works without a student account.
- [ ] Tracking code generation is unique and human-readable.
- [ ] Lead triage updates severity, repair method, issue category, and audit events.
- [ ] Assignment is limited to active technicians or lead technicians.
- [ ] Technician queue returns assigned tickets only for regular technicians.
- [ ] Technician status updates follow allowed transitions.
- [ ] Custody check-in requires storage location and authorized lead/admin actor.
- [ ] Custody status transitions follow the lifecycle.
- [ ] Pickup confirmation requires ready-for-collection custody.
- [ ] Public tracking remains limited after each workflow step.

## Notifications

- [ ] Notification abstraction uses local/stub provider only unless a real provider is intentionally enabled in a future phase.
- [ ] Notification event creation failures do not roll back core ticket or custody actions.
- [ ] Notification templates are student-safe.
- [ ] No real WhatsApp vendor credentials or calls are configured for this release.

## Operations

- [ ] Admin and lead seed accounts or onboarding procedure are ready.
- [ ] Manual QA checklist has been completed.
- [ ] Support contact and incident escalation path are documented for the service desk team.
- [ ] Database backup policy is enabled.
- [ ] Deployment owner knows how to inspect application logs.
- [ ] Release notes mention known limitations: no real WhatsApp provider, no report export, and no removal of legacy student/account flows yet.

## Post-Deploy Smoke Test

- [ ] Log in as admin.
- [ ] Log in as lead technician.
- [ ] Log in as technician.
- [ ] Submit a public repair request.
- [ ] Track the new request by tracking code.
- [ ] Triage and assign the ticket.
- [ ] Open the assigned technician ticket.
- [ ] Check in custody as lead/admin.
- [ ] Mark ready for collection and confirm pickup.
- [ ] Open service-desk reports and confirm counts update.
- [ ] Confirm public tracking still excludes private fields.

## Launch Decision

- [ ] No critical authorization, privacy, migration, or build issues remain.
- [ ] Remaining risks are accepted by the release owner.
- [ ] Production deployment is approved.
