# Service Desk Workflow

This document defines the target FarsamoTech V2 workflow for SIMAD IT Service Desk.

The system should support one operating question:

```text
Does this help move a device from request to pickup faster, safer, or with better accountability?
```

## Workflow Summary

The service desk lifecycle has four phases:

```text
Request
  ->
Triage
  ->
Repair
  ->
Close
```

The full request-to-pickup workflow is:

```text
Requester submits repair request
  ->
System creates tracking code
  ->
Requester receives confirmation and WhatsApp message
  ->
Lead technician reviews request
  ->
Lead technician sets severity and repair method
  ->
Lead technician decides remote support or physical device handling
  ->
Technician is assigned
  ->
Device is checked in if needed
  ->
Technician diagnoses and repairs
  ->
Lead technician verifies completion
  ->
Device is marked ready for pickup
  ->
Requester confirms pickup
  ->
Ticket is closed
```

## Normal Operation Flow

Normal operation handles a low number of requests per day.

1. Student or lecturer opens the public request page.
2. Requester enters contact, device, and issue information.
3. System creates a tracking code such as `SIM-2026-000412`.
4. System sends a WhatsApp confirmation when the provider is enabled.
5. Lead technician reviews the new request.
6. Lead technician classifies the issue and severity.
7. Lead technician chooses repair method:
   - Remote Support
   - Walk-In Service
   - Hardware Repair
   - Software Repair
8. Lead technician assigns a technician or requests more requester action.
9. If device handling is required, requester is told when and where to bring the device.
10. Lead technician or authorized intake staff checks in the device.
11. Technician diagnoses and repairs the device.
12. Lead technician verifies completion or sends work back.
13. Requester receives ready-for-pickup notification.
14. Requester collects device using pickup confirmation.
15. Ticket closes.

## Maintenance-Week Quick Intake Flow

Maintenance-week intake optimizes for speed and queue control.

The intake form should be short enough to complete in under 60 seconds:

- Name
- Student or staff ID
- Phone
- Faculty
- Device
- Issue

Workflow:

1. Student or lecturer arrives physically.
2. Intake staff or lead technician opens quick intake.
3. Minimal requester, device, and issue data is captured.
4. System creates tracking code and optional QR.
5. Device custody check-in captures condition, accessories, photos, and storage location if the device is left with the team.
6. Lead technician routes the ticket into the queue.
7. Technicians work from assigned queues.
8. Ready-for-pickup and pickup confirmation follow the same custody rules as normal operation.

Maintenance-week priority:

- Fast intake.
- Queue visibility.
- Workload balancing.
- Custody accountability.
- Clear pickup communication.

## Triage Outcomes

Lead technician triage should produce one of these operational outcomes:

### Remote Solution

Use when the issue can be handled without physical device custody.

Examples:

- Office activation.
- Software installation guidance.
- WiFi configuration.
- Email account issue.

Outcome:

- Technician contacts requester or sends instructions.
- Ticket may move to Waiting for Student or Closed after resolution.
- Custody remains Not Received.

### Bring Device

Use when hands-on repair is needed.

Examples:

- Windows corruption.
- OS reinstall.
- Malware cleanup.
- Severe performance issue.

Outcome:

- Requester receives location, hours, tracking code, and instructions.
- Ticket moves to Waiting for Device.
- Custody remains Not Received until check-in.

### Hardware Issue

Use when replacement parts or physical repair may be needed.

Examples:

- Broken screen.
- Broken keyboard.
- Dead SSD.
- Charger failure.

Outcome:

- Technician diagnoses.
- If a part is needed, ticket moves to Waiting for Replacement Part or Waiting for Student.
- Cost/part requirement is communicated through approved channel.

### Invalid, Duplicate, Or Cancelled

Use when a request should not continue.

Examples:

- Duplicate request.
- Not a supported service.
- Requester cancels.

Outcome:

- Ticket moves to Cancelled.
- Reason is recorded.

## Ticket Status Lifecycle

Ticket status describes repair progress, not physical custody.

Target statuses:

```text
Submitted
Triage Review
Waiting for Device
Received
Assigned
Diagnosing
Waiting for Student
Waiting for Replacement Part
Repairing
Quality Check
Ready for Pickup
Closed
Cancelled
```

Recommended transition flow:

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
Repairing
  ->
Quality Check
  ->
Ready for Pickup
  ->
Closed
```

Alternative branches:

```text
Diagnosing -> Waiting for Student -> Diagnosing
Diagnosing -> Waiting for Replacement Part -> Repairing
Repairing -> Waiting for Student -> Repairing
Triage Review -> Cancelled
Waiting for Device -> Cancelled
Waiting for Student -> Cancelled
```

Remote support tickets may skip physical receipt states according to the final transition matrix.

## Custody Status Lifecycle

Custody status describes where the physical device is.

Target statuses:

```text
Not Received
Received
In Repair Room
Ready for Collection
Collected
```

Recommended transition flow:

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

Remote-support tickets may remain `Not Received` for their entire lifecycle.

## Device Check-In Process

When a device is physically handed over, the system should capture:

- Ticket tracking code.
- Owner/requester name.
- Device type, brand, and model.
- Received by.
- Received at.
- Condition.
- Screen condition.
- Keyboard condition.
- Battery/body condition.
- Accessories received.
- Photos where configured.
- Storage location.

Example accessories:

- Charger.
- Mouse.
- Bag.
- External drive.

Example storage locations:

- Shelf A3.
- Cabinet B2.
- Repair Room Table 4.

Device check-in protects both students and technicians by making custody explicit.

## Pickup Process

When a repair is complete:

1. Lead technician or authorized staff marks ticket Ready for Pickup.
2. Custody moves to Ready for Collection.
3. Requester receives pickup notification.
4. Requester provides pickup code or signs physical confirmation.
5. Staff records collector name and collection time.
6. Custody moves to Collected.
7. Ticket moves to Closed according to closure policy.

## Role Responsibilities

### Public Requester

Can:

- Submit request.
- Track repair.
- Receive WhatsApp updates.
- Confirm pickup.

Cannot:

- Access internal notes.
- Assign technicians.
- Manage custody.
- View reports.

### Lead Technician

Can:

- Review new requests.
- Triage and classify issues.
- Set severity.
- Set repair method.
- Assign and reassign technicians.
- Monitor queues and overdue work.
- Check in devices or supervise check-in.
- Verify repair completion.
- Mark ready for pickup.
- Approve closure/cancellation.

### Technician

Can:

- View assigned tickets.
- Diagnose issues.
- Add repair notes.
- Record parts required.
- Update assigned ticket progress.
- Request student action.
- Submit repair for verification.

Cannot by default:

- Assign or reassign tickets.
- Access unrelated tickets.
- Close administrative cases.
- Manage staff.

### Admin

Can:

- Manage staff accounts.
- Review reports.
- Configure system settings.
- Plan maintenance-week operations.
- Monitor service performance.

Admin is management. Lead technician is operations.

## Communication Rules

Website:

- Submit request.
- Track repair.
- Confirm pickup when required.

WhatsApp:

- Ticket received.
- Bring device requested.
- Device received.
- Technician assigned.
- Waiting for student.
- Replacement part required.
- Ready for pickup.
- Pickup reminder.
- Ticket closed.

Do not expose technician personal phone numbers by default. Prefer system-routed contact or controlled communication.
