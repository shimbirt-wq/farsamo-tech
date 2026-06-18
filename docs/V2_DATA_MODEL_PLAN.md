# V2 Data Model Plan

This document proposes the target data model for FarsamoTech V2 as SIMAD IT Service Desk.

No schema changes are made in Phase 1. This is a planning document for later migrations.

## Data Model Goals

- Support public repair requests without mandatory student accounts.
- Keep staff users authenticated and role-based.
- Separate requester identity from staff users.
- Separate ticket repair status from physical device custody status.
- Support lead technician triage, severity, repair method, and assignment.
- Support WhatsApp-first notification events.
- Preserve backward compatibility with existing tickets during migration.

## Proposed Entities

### Staff User

Represents authenticated internal users.

Current `User` may remain the backing table initially, but V2 should conceptually treat it as staff-oriented once public requester flow is implemented.

Fields to support:

- `id`
- `fullName`
- `email`
- `passwordHash`
- `role`
- `phone`
- `isActive`
- `createdAt`
- `updatedAt`

Target staff roles:

- `TECHNICIAN`
- `LEAD_TECHNICIAN`
- `ADMIN`

### Requester

Represents the student or lecturer who requests service.

Possible fields:

- `id`
- `requesterType`
- `fullName`
- `universityId`
- `faculty`
- `department`
- `phone`
- `email`
- `createdAt`
- `updatedAt`

Requester records may be matched by `universityId`, phone, or email, but matching rules must avoid unsafe merging.

### Device

Represents a device involved in repair.

Possible fields:

- `id`
- `requesterId`
- `deviceType`
- `brand`
- `model`
- `serialNumber`
- `assetTag`
- `description`
- `createdAt`
- `updatedAt`

Serial number may remain optional. If uniqueness is added later, handle nulls and duplicate legacy data carefully.

### Repair Ticket

Represents the repair/service request.

Possible fields:

- `id`
- `trackingCode`
- `requesterId`
- `deviceId`
- `triagedById`
- `assignedTechnicianId`
- `issueCategory`
- `issueDescription`
- `severity`
- `repairMethod`
- `status`
- `triageNotes`
- `studentActionRequired`
- `partRequirement`
- `pickupCodeHash`
- `submittedAt`
- `triagedAt`
- `assignedAt`
- `completedAt`
- `readyForPickupAt`
- `closedAt`
- `cancelledAt`
- `createdAt`
- `updatedAt`

The current `ticketId` concept can evolve into or remain equivalent to `trackingCode`.

### Device Custody

Represents physical possession and storage of a device for a ticket.

Possible fields:

- `id`
- `ticketId`
- `deviceId`
- `status`
- `receivedById`
- `receivedAt`
- `condition`
- `screenCondition`
- `keyboardCondition`
- `batteryCondition`
- `bodyCondition`
- `accessories`
- `storageLocation`
- `checkInPhotoUrls`
- `releasedById`
- `readyForCollectionAt`
- `collectedByName`
- `collectedByPhone`
- `collectedAt`
- `pickupCodeVerifiedAt`
- `createdAt`
- `updatedAt`

Custody may be absent or remain `NOT_RECEIVED` for remote-support tickets.

### Repair Event

Represents the audit timeline for status changes, custody changes, notes, and operational events.

Possible fields:

- `id`
- `ticketId`
- `actorId`
- `actorRole`
- `eventType`
- `statusFrom`
- `statusTo`
- `custodyFrom`
- `custodyTo`
- `note`
- `metadata`
- `createdAt`

This can either replace or coexist with the current `RepairLog` model during migration.

### Notification Event

Represents a domain notification that should be sent through one or more channels.

Possible fields:

- `id`
- `ticketId`
- `recipientType`
- `recipientName`
- `recipientPhone`
- `recipientEmail`
- `eventType`
- `channel`
- `templateKey`
- `payload`
- `status`
- `createdAt`
- `updatedAt`

### Notification Delivery Attempt

Represents provider-specific delivery attempts.

Possible fields:

- `id`
- `notificationEventId`
- `provider`
- `providerMessageId`
- `status`
- `errorMessage`
- `attemptedAt`
- `createdAt`

## Proposed Enum Changes

### User Role

Current:

```text
STUDENT
LECTURER
TECHNICIAN
ADMIN
```

Target:

```text
TECHNICIAN
LEAD_TECHNICIAN
ADMIN
```

Transition note:

Keep `STUDENT` and `LECTURER` until public requester flow replaces account-based student workflows and legacy data is migrated.

### Requester Type

Proposed:

```text
STUDENT
LECTURER
STAFF
OTHER
```

### Ticket Status

Current:

```text
REGISTRATION_COMPLETED
DEVICE_RECEIVED
DIAGNOSIS_IN_PROGRESS
REPAIR_IN_PROGRESS
QUALITY_INSPECTION
READY_FOR_COLLECTION
DEVICE_COLLECTED
```

Target:

```text
SUBMITTED
TRIAGE_REVIEW
WAITING_FOR_DEVICE
RECEIVED
ASSIGNED
DIAGNOSING
WAITING_FOR_STUDENT
WAITING_FOR_REPLACEMENT_PART
REPAIRING
QUALITY_CHECK
READY_FOR_PICKUP
CLOSED
CANCELLED
```

### Custody Status

Proposed:

```text
NOT_RECEIVED
RECEIVED
IN_REPAIR_ROOM
READY_FOR_COLLECTION
COLLECTED
```

### Severity

Proposed:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

### Repair Method

Proposed:

```text
REMOTE_SUPPORT
WALK_IN_SERVICE
HARDWARE_REPAIR
SOFTWARE_REPAIR
```

### Notification Channel

Current:

```text
DASHBOARD
EMAIL
```

Target:

```text
DASHBOARD
WHATSAPP
EMAIL
SMS
```

### Notification Event Type

Proposed:

```text
TICKET_RECEIVED
TRIAGE_COMPLETED
BRING_DEVICE_REQUESTED
DEVICE_RECEIVED
TECHNICIAN_ASSIGNED
WAITING_FOR_STUDENT
REPLACEMENT_PART_REQUIRED
READY_FOR_PICKUP
PICKUP_REMINDER
TICKET_CLOSED
TICKET_CANCELLED
```

## Migration Strategy

### Step 1: Additive Schema Changes

Add new tables and fields without deleting old columns or changing existing routes.

Candidate additions:

- `Requester`
- `DeviceCustody`
- `RepairEvent`
- `NotificationEvent`
- `NotificationDeliveryAttempt`
- Ticket fields for severity, repair method, triage metadata, and pickup code.
- Role enum addition for `LEAD_TECHNICIAN`.

### Step 2: Backfill Legacy Data

For existing tickets:

- Create requester records from existing ticket owner/user data.
- Link existing devices to requester records where safe.
- Map old statuses to closest V2 statuses.
- Create initial custody state:
  - `COLLECTED` for `DEVICE_COLLECTED`
  - `READY_FOR_COLLECTION` for `READY_FOR_COLLECTION`
  - `IN_REPAIR_ROOM` or `RECEIVED` for in-progress physical work
  - `NOT_RECEIVED` when physical receipt is unknown

Backfill should be explicit and reviewed before applying to production.

### Step 3: Dual-Read / Dual-Write Period

During transition:

- Existing pages continue to work.
- New public request flow writes V2 fields.
- Internal tools read V2 fields where available and fall back to legacy fields where needed.
- Repair events can be written alongside existing repair logs.

### Step 4: Replace Student Portal Flow

After public request and tracking are validated:

- Hide account-required student submission from primary navigation.
- Keep login-based flows only where needed for backward compatibility.
- Redirect students to public submission and tracking.

### Step 5: Cleanup

After data migration and replacement flows are stable:

- Remove obsolete student dashboard/profile assumptions.
- Remove duplicate notification paths.
- Consolidate repair logs into repair events if selected.
- Update tests and documentation.

## Backward Compatibility Notes

- Existing users, devices, tickets, logs, and notifications must remain readable.
- Existing ticket IDs must continue to resolve in lookup/tracking flows.
- Do not delete `STUDENT` or `LECTURER` roles until no runtime path depends on them.
- Do not make requester records mandatory for old tickets until backfill is complete.
- Do not make custody records mandatory for remote-support tickets.
- Keep public tracking responses limited even when legacy user data exists.
- Keep seed data updated so both old and new flows can be tested during transition.

## Risks

### Public Tracking Privacy

Tracking code lookup can expose private details if response shape is too broad.

Mitigation:

- Return limited status/timeline data.
- Hide internal notes, exact contact data, staff-only metadata, and custody photos.
- Consider phone plus tracking-code verification.

### Requester Duplication

Public requests can create duplicate requester records.

Mitigation:

- Use cautious matching by university ID, phone, or email.
- Do not merge automatically when identity is ambiguous.
- Provide admin cleanup later.

### Status Migration Confusion

Old statuses do not map perfectly to V2 statuses.

Mitigation:

- Keep mapping explicit.
- Preserve original status in audit metadata during migration if needed.
- Test all mapped states.

### Custody Liability

Custody records can create operational/legal expectations.

Mitigation:

- Make check-in process clear.
- Capture condition, accessories, photos, storage location, and responsible staff.
- Restrict custody edits and keep audit events.

### WhatsApp Provider Dependency

Provider failure should not block core repair operations.

Mitigation:

- Use notification events and delivery attempts.
- Record failed sends.
- Retry when appropriate.
- Allow manual resend.

### Lead Technician Bottleneck

Centralizing triage can slow work if the command center is poor.

Mitigation:

- Build queue filters, bulk assignment, severity sorting, and maintenance-week quick actions.
- Allow delegated intake permissions if needed.

### Backward Compatibility

Existing code assumes student/lecturer accounts and device ownership.

Mitigation:

- Use additive migrations.
- Keep old routes during transition.
- Replace navigation only after new flows are ready.
- Maintain test coverage for both old and new paths until cleanup.
