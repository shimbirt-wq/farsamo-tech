# V2 Manual QA Checklist

Use this checklist before a V2 service-desk release. Record tester, date, environment, browser, and any ticket tracking codes used during the run.

## Pre-Run Setup

- [ ] Confirm the target environment URL.
- [ ] Confirm database migrations are applied.
- [ ] Confirm seed or test accounts exist for `ADMIN`, `LEAD_TECHNICIAN`, `TECHNICIAN`, and a regular student or lecturer user.
- [ ] Confirm `JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL`, and upload-related environment variables are configured for the environment.
- [ ] Confirm no real WhatsApp provider is expected in this release.

## Public Request Flow

- [ ] Open `/request-repair` while logged out.
- [ ] Submit a valid public repair request with requester, device, and issue details.
- [ ] Confirm a tracking code is returned and shown to the requester.
- [ ] Submit invalid public repair data and confirm validation errors are shown.
- [ ] Confirm the public request response does not show `pickupCodeHash`, triage notes, internal repair notes, custody photos, storage location, requester email, or requester phone beyond what the requester entered in the form.

## Public Tracking Flow

- [ ] Open `/track`.
- [ ] Search with a valid tracking code.
- [ ] Confirm public status, device summary, requester first/display-safe name, issue category, and public timeline appear.
- [ ] Search with an invalid code format and confirm a clear validation state.
- [ ] Search with a non-existent code and confirm a not-found state.
- [ ] Confirm public tracking does not show internal notes, triage notes, diagnosis notes, repair notes, requester phone, requester email, custody photos, storage location, pickup hash, or password hashes.

## Lead Technician Command Center

- [ ] Log in as `LEAD_TECHNICIAN`.
- [ ] Confirm `/lead` is accessible.
- [ ] Confirm the triage queue loads with empty, loading, and error states where applicable.
- [ ] Open a ticket detail.
- [ ] Update triage fields: issue category, severity, repair method, and triage notes.
- [ ] Assign a valid active technician.
- [ ] Confirm repair events are created for triage and assignment.
- [ ] Confirm requester contact is visible only in the authenticated lead detail view.
- [ ] Confirm a regular `TECHNICIAN` cannot access `/lead` or lead APIs.

## Technician Workspace

- [ ] Log in as `TECHNICIAN`.
- [ ] Confirm `/technician/workspace` is accessible.
- [ ] Confirm only assigned tickets appear in the queue.
- [ ] Try to open an unassigned ticket directly by id or tracking code and confirm access is blocked.
- [ ] Add a diagnosis or repair note to an assigned ticket.
- [ ] Confirm repair notes are not visible in public tracking.
- [ ] Move repair status through allowed technician progress states.
- [ ] Try an invalid status transition and confirm it is rejected.
- [ ] Request student action and confirm the ticket remains assigned and auditable.
- [ ] Submit work for quality check.

## Device Custody

- [ ] Log in as `LEAD_TECHNICIAN` or `ADMIN`.
- [ ] Open a selected ticket in `/lead`.
- [ ] Confirm custody panel loads and handles no-custody state.
- [ ] Check in a device with condition, accessories, and required storage location.
- [ ] Confirm check-in without storage location is rejected.
- [ ] Move custody from `RECEIVED` to `IN_REPAIR_ROOM`.
- [ ] Move custody from `IN_REPAIR_ROOM` to `READY_FOR_COLLECTION`.
- [ ] Confirm invalid custody jumps are rejected.
- [ ] Confirm pickup is unavailable until custody is `READY_FOR_COLLECTION`.
- [ ] Confirm pickup with collector name and optional phone.
- [ ] Confirm custody photos and pickup code hashes are not exposed publicly.
- [ ] Confirm a regular `TECHNICIAN` cannot mutate custody.

## Notifications

- [ ] Confirm public request creation creates a ticket-received notification event where a recipient exists.
- [ ] Confirm triage, assignment, student action, device received, ready for pickup, and ticket closed actions create notification records.
- [ ] Confirm sending uses the local/stub provider only.
- [ ] Confirm notification failure does not roll back ticket, triage, technician, or custody actions.
- [ ] Confirm notification templates do not include internal notes, custody photos, storage location, pickup hash, or staff-only metadata.

## Service Desk Reports

- [ ] Log in as `ADMIN`.
- [ ] Open `/admin/service-desk/reports`.
- [ ] Confirm overview counts load.
- [ ] Confirm tickets by faculty and issue category load.
- [ ] Confirm technician workload loads.
- [ ] Confirm custody exceptions are visually prominent.
- [ ] Confirm storage location appears only in the internal custody exceptions report.
- [ ] Confirm requester phone, requester email, pickup hash, custody photos, internal notes, and password hashes do not appear.
- [ ] Log in as `LEAD_TECHNICIAN` and confirm reports are accessible.
- [ ] Log in as `TECHNICIAN` and confirm reports are not visible in navigation and the report page/API are blocked.

## Navigation And Role Access

- [ ] `ADMIN` navigation includes dashboard, lead command, workspace, tickets, admin devices, users, reports, and profile.
- [ ] `LEAD_TECHNICIAN` navigation includes dashboard, lead command, workspace, tickets, devices, reports, and profile.
- [ ] `TECHNICIAN` navigation includes dashboard, workspace, assigned tickets, devices, and profile only.
- [ ] Student/lecturer navigation does not include staff-only lead, technician, custody, or service-desk reports surfaces.
- [ ] Inactive users cannot access authenticated pages or APIs.

## Regression Checks

- [ ] Existing authenticated student/account flows still work.
- [ ] Existing repair ticket pages still load.
- [ ] Existing device pages still load.
- [ ] Existing notifications page still loads.
- [ ] Existing legacy reports page still remains available to admins.

## Required Commands

- [ ] `npx prisma validate`
- [ ] `npx prisma migrate status`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run lint`
- [ ] `npm run build`

## Sign-Off

- [ ] No blocker defects remain.
- [ ] Known risks are documented.
- [ ] Production readiness checklist has been reviewed.
- [ ] Release owner approves deployment.
