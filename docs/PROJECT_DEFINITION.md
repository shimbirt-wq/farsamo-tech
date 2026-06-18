# Project Definition

## Product Name

FarsamoTech V2: SIMAD IT Service Desk

## Team Name

XeelTech Solutions

## Product Direction

FarsamoTech V2 is a university IT service desk for SIMAD computer repair operations. The platform should move a device from request to pickup faster, safer, and with clearer accountability.

The product is no longer defined as a traditional student portal with accounts, dashboards, profiles, and frequent self-service use. Most students and lecturers submit repair requests rarely, so the public experience should be lightweight:

```text
Submit repair request
  ->
Receive tracking code
  ->
Receive WhatsApp updates
  ->
Track repair status
  ->
Pickup device with confirmation
```

Authenticated tools are primarily for staff who operate the repair service: lead technicians, technicians, and maintenance administrators.

## Problem Statement

SIMAD's computer maintenance process can involve both normal daily operations and high-volume Computer Maintenance Week events. Manual registration, paper records, spreadsheets, and direct informal communication create operational risks:

- Students face unnecessary friction if they must create accounts before submitting occasional repair requests.
- New repair requests need triage before students are told to bring devices physically.
- Technicians need assigned work queues instead of random ticket pulling.
- Lead technicians need an operational command center for triage, prioritization, assignment, and workload balancing.
- Physical devices need custody tracking to prevent lost laptops, missing chargers, unclear storage location, and pickup disputes.
- Students are more likely to read WhatsApp updates than revisit a portal.
- Administrators need oversight and reporting without managing daily repair operations directly.

## Product Goals

- Provide public repair intake without requiring student or lecturer login.
- Create a tracking code for every request.
- Support lead technician triage before repair work begins.
- Route each ticket through the correct repair method: remote support, walk-in service, hardware repair, or software repair.
- Give technicians a focused assigned queue.
- Track device custody separately from repair status.
- Use WhatsApp as the primary communication layer for request updates, reminders, and pickup notifications.
- Give admins management-level reporting and configuration tools.
- Support both normal low-volume operations and maintenance-week quick intake.

## Core Operating Model

The platform should follow four service-desk phases:

```text
Request
  ->
Triage
  ->
Repair
  ->
Close
```

The full target workflow is:

```text
Student or lecturer request
  ->
Ticket created
  ->
Lead technician triage
  ->
Technician assignment
  ->
Device check-in if physical handling is required
  ->
Repair process
  ->
Quality verification
  ->
Ready for pickup
  ->
Pickup confirmation
  ->
Closed
```

## Primary Actors

### Public Requester

Usually a student or lecturer. No account is required for the target V2 public flow.

Can:

- Submit a repair request.
- Receive a tracking code.
- Track repair progress by tracking code, or by phone plus code if required.
- Receive WhatsApp updates.
- Confirm pickup with a pickup code or physical confirmation process.

Cannot:

- Access internal dashboards.
- Assign technicians.
- View internal repair notes.
- Manage staff or reports.

### Lead Technician

The operational owner of daily repair work.

Can:

- Review new requests.
- Classify issue category.
- Set severity.
- Select repair method.
- Decide whether remote support or physical device check-in is needed.
- Assign and reassign technicians.
- Monitor workload and overdue repairs.
- Check in devices or supervise check-in.
- Verify repair completion.
- Mark devices ready for pickup.
- Approve closure or cancellation.

### Technician

The repair worker responsible for assigned tickets.

Can:

- View assigned queue.
- Diagnose issues.
- Add repair notes.
- Request student action.
- Record parts required.
- Update repair progress according to allowed workflow.
- Mark work complete for lead technician verification.

Cannot:

- Randomly pull unassigned tickets.
- Assign or reassign tickets unless explicitly granted later.
- Own management reports or staff configuration.

### Maintenance Admin

The management and oversight actor.

Can:

- Manage staff accounts.
- Review reports and analytics.
- Configure maintenance-week settings.
- Review service performance.
- Support system administration.

Admin should not be the daily repair dispatcher. Daily operations should be led by the lead technician.

## Target Modules

### Module 1: Repair Intake

Public request submission for students and lecturers.

Normal operation fields may include:

- Name
- Student or staff ID
- Requester type
- Faculty
- Department
- Phone
- Email
- Device type
- Brand
- Model
- Issue category
- Description
- Optional photo

Maintenance-week quick intake should be shorter and optimized for under 60 seconds:

- Name
- Student or staff ID
- Phone
- Faculty
- Device
- Issue

### Module 2: Lead Technician Command Center

Operational control surface for new requests, waiting assignment, waiting student action, devices not received, in-repair work, ready-for-pickup items, and overdue repairs.

### Module 3: Technician Workspace

Focused assigned queue with diagnosis, repair notes, status updates, part requirements, and work completion.

### Module 4: Device Custody Tracking

Tracks physical responsibility for the device separately from ticket status.

Custody records should capture:

- Received by
- Received at
- Device condition
- Screen condition
- Keyboard condition
- Battery/body condition
- Accessories received
- Photos where appropriate
- Storage location
- Released by
- Collected by
- Collected at
- Pickup confirmation

### Module 5: WhatsApp Communication

WhatsApp should be the primary student-facing communication channel.

Important events should trigger WhatsApp messages:

- Ticket received
- Triage completed
- Bring device requested
- Device received
- Technician assigned
- Waiting for student
- Replacement part required
- Ready for pickup
- Pickup reminder
- Ticket closed

### Module 6: Admin Oversight And Reporting

Admin-facing analytics for:

- Repairs by faculty
- Most common problems
- Technician performance
- Average resolution time
- Monthly trends
- Maintenance-week volume
- Device custody exceptions

## Target Ticket Statuses

Ticket status describes repair progress:

- Submitted
- Triage Review
- Waiting for Device
- Received
- Assigned
- Diagnosing
- Waiting for Student
- Waiting for Replacement Part
- Repairing
- Quality Check
- Ready for Pickup
- Closed
- Cancelled

## Target Custody Statuses

Custody status describes where the physical device is:

- Not Received
- Received
- In Repair Room
- Ready for Collection
- Collected

Ticket status and custody status must remain separate.

## Severity

Severity helps the lead technician prioritize work:

- Critical: cannot boot, critical academic impact, urgent teaching/lab dependency.
- High: crashes, unusable system, severe performance or malware issue.
- Medium: software installation, configuration, recoverable performance issue.
- Low: cleanup, routine support, minor configuration.

## Repair Method

Repair method describes the operational path:

- Remote Support
- Walk-In Service
- Hardware Repair
- Software Repair

The lead technician decides the repair method during triage.

## Out Of Scope For Phase 1

Phase 1 is documentation and planning only.

Do not change:

- Prisma schema
- Runtime code
- UI screens
- Existing routes
- Existing authentication behavior
- Existing tests
- Existing student dashboard/profile pages

Those changes belong to later implementation phases.
