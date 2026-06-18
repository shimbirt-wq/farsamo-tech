# Architecture

## System Overview

FarsamoTech V2 should evolve into SIMAD IT Service Desk: a public request and tracking surface plus authenticated internal staff tools for triage, repair work, custody control, WhatsApp notifications, and management reporting.

Current implementation remains unchanged during Phase 1. This document describes the target V2 architecture that future schema and UI work should follow.

```text
Public requester
  ->
Public request and tracking pages
  ->
Next.js route handlers / server modules
  ->
Prisma ORM
  ->
PostgreSQL
  ->
Staff tools, custody tracking, reports, notifications
```

Authenticated staff tools:

```text
Lead Technician / Technician / Admin
  ->
Staff-authenticated Next.js app
  ->
Authorization helpers
  ->
Domain services
  ->
Prisma / PostgreSQL
```

Notification delivery:

```text
Domain event
  ->
Notification provider abstraction
  ->
Dashboard record, WhatsApp provider, email provider, or future channel
```

## Architecture Principles

- Public request submission should not require student or lecturer account creation.
- Staff operations must remain authenticated and role-authorized.
- Lead technician owns triage, assignment, prioritization, custody intake, and operational verification.
- Technicians work from assigned queues.
- Admins manage staff, configuration, and reports; they are not the daily dispatcher.
- Ticket status and device custody status are separate concepts.
- WhatsApp is the primary requester communication channel; the website is primarily for submit and track.
- Domain logic should live in server modules and route handlers, not client-only UI checks.
- Future migrations should preserve current MVP behavior until replacement flows are ready.

## Core Layers

### Public Requester Layer

The public layer supports students and lecturers without requiring login.

Responsibilities:

- Public repair request form.
- Maintenance-week quick intake form.
- Tracking code confirmation.
- Public tracking page with limited safe ticket data.
- Pickup confirmation flow when enabled.

The public layer must not expose internal notes, staff-only data, full requester records, or private custody photos.

### Staff-Authenticated Internal Layer

Staff users authenticate before accessing internal tools.

Supported staff roles in the V2 target model:

- Lead Technician
- Technician
- Admin

Student/lecturer accounts are not required for the target public flow. If backward compatibility requires existing student users to remain temporarily, they should not drive the V2 product model.

### Domain Services Layer

Route handlers should delegate business logic to focused server modules.

Target service areas:

- Request intake
- Tracking lookup
- Triage
- Assignment
- Technician queue
- Repair logs
- Custody check-in and pickup
- Notification events
- Reports
- Staff/user management

### Data Access Layer

Prisma remains the preferred typed access layer for PostgreSQL.

Future schema changes should introduce V2 concepts incrementally:

- Requester identity separate from staff users.
- Ticket severity and repair method.
- Lead technician triage metadata.
- Device custody records.
- Structured repair/audit events.
- Notification delivery attempts.

## Target Domain Modules

### Request Intake

Creates a ticket from public requester data.

Responsibilities:

- Validate requester, contact, device, and issue fields.
- Generate a tracking code.
- Store requester and device details.
- Set initial ticket status to Submitted.
- Trigger ticket-received notification event.
- Support short maintenance-week intake.

### Tracking

Allows public users to check repair progress safely.

Responsibilities:

- Validate tracking code.
- Optionally require phone number plus code for stronger lookup.
- Return limited timeline/status data.
- Hide internal notes, sensitive staff details, private photos, and admin metadata.

### Lead Technician Command Center

The operational control center.

Responsibilities:

- Show new requests.
- Show waiting assignment, waiting student, not received, in repair, ready for pickup, and overdue queues.
- Classify issue category.
- Set severity.
- Select repair method.
- Assign or reassign technicians.
- Request student action.
- Initiate or supervise device check-in.
- Verify completion.
- Mark ready for pickup.
- Close or cancel according to policy.

### Technician Workspace

Focused repair workspace.

Responsibilities:

- Show assigned queue.
- Show ticket details required for repair.
- Add diagnosis and repair notes.
- Record parts required.
- Update repair progress.
- Request student action.
- Submit work for verification.

Technicians should not become the public support desk or random dispatchers.

### Device Custody

Tracks physical handling of devices.

Responsibilities:

- Record when a device is received.
- Record device condition and accessories.
- Store check-in photos where configured.
- Track storage location.
- Track who received, moved, released, and confirmed pickup.
- Keep custody lifecycle separate from repair status.

Custody status:

```text
Not Received
Received
In Repair Room
Ready For Collection
Collected
```

### Notifications

Notifications should be event-driven and channel-agnostic.

Responsibilities:

- Create notification events from domain actions.
- Store delivery attempts.
- Route messages to configured providers.
- Support dashboard records for staff.
- Support WhatsApp-first requester messages.
- Allow future email/SMS providers.

Provider abstraction:

```text
NotificationEvent
  ->
NotificationProvider
  ->
send(message, recipient, metadata)
```

Initial implementation can use a stub/provider interface before real WhatsApp integration.

### Admin Portal

Admin portal is for management, not daily dispatch.

Responsibilities:

- Staff account management.
- Role management.
- Reports and analytics.
- Maintenance-week planning/configuration.
- System configuration.
- Operational oversight.

## Target Lifecycle

### Ticket Status Lifecycle

Ticket status answers: what is happening with the repair?

```text
Submitted
  ->
Triage Review
  ->
Waiting for Device
  ->
Received
  ->
Assigned
  ->
Diagnosing
  ->
Waiting for Student / Waiting for Replacement Part / Repairing
  ->
Quality Check
  ->
Ready for Pickup
  ->
Closed
```

Cancellation may occur from defined states:

```text
Submitted
Triage Review
Waiting for Device
Waiting for Student
```

The exact transition matrix should be implemented in code during schema/workflow phases.

### Custody Status Lifecycle

Custody status answers: where is the physical device?

```text
Not Received
  ->
Received
  ->
In Repair Room
  ->
Ready for Collection
  ->
Collected
```

Remote support tickets can remain `Not Received` for the entire lifecycle.

## Authorization Model

### Public Requester

Can:

- Submit request.
- Track limited status.
- Confirm pickup when provided with a valid pickup code.

Cannot:

- View internal notes.
- View staff dashboards.
- Assign technicians.
- View reports.

### Lead Technician

Can:

- Triage new tickets.
- Assign/reassign technicians.
- Set severity and repair method.
- Check in devices.
- Verify completion.
- Mark ready for pickup.
- Close/cancel tickets according to policy.

### Technician

Can:

- View assigned tickets.
- Add diagnosis and repair notes.
- Update allowed repair statuses.
- Request student action.
- Record required parts.

Cannot:

- Assign or reassign tickets by default.
- Access unassigned tickets by default.
- Manage staff or reports.

### Admin

Can:

- Manage staff users and roles.
- View management reports.
- Configure service-desk settings.
- Review operational metrics.

Admin may have emergency override permissions, but daily dispatch belongs to lead technician.

## Reporting Architecture

Reports should derive from structured ticket, custody, and event data.

Target reporting areas:

- Repairs by faculty.
- Most common issue categories.
- Technician workload and performance.
- Average triage time.
- Average resolution time.
- Tickets waiting for student.
- Tickets waiting for replacement part.
- Custody exceptions and overdue pickups.
- Maintenance-week volume and throughput.

## Backward Compatibility

During the transition from the current MVP:

- Keep current routes and UI working until replacement flows exist.
- Do not remove student accounts until requester-based public intake is implemented and validated.
- Introduce schema additions before deleting legacy assumptions.
- Keep tests passing after each phase.
- Migrate data carefully so existing tickets remain traceable.

## External Services

### WhatsApp Provider

Target channel for requester updates and pickup reminders.

### Email Provider

Optional secondary channel for users who provide email.

### Object Storage

Used for request photos and custody check-in photos. Access must be controlled.

### QR/Tracking Code Support

Used to open public tracking pages or quick staff lookup during maintenance week.
