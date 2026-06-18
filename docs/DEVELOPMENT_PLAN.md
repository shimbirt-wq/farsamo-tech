# Development Plan

This document defines the V2 implementation plan for FarsamoTech as SIMAD IT Service Desk.

Phase 1 is documentation and planning only. It must not change runtime code, Prisma schema, UI, routes, or tests.

## Product North Star

Every feature must answer this question:

```text
Does this help move a device from request to pickup faster, safer, or with better accountability?
```

If the answer is no, the feature should be removed, deferred, or redesigned.

## Global Rules

- Preserve existing architecture and conventions.
- Implement incrementally.
- Avoid unrelated refactors.
- Keep existing app behavior working during the transition.
- Do not remove current student/account features until replacement public flows are implemented and validated.
- Keep authentication for staff-only tools.
- Do not require public students or lecturers to create accounts in the V2 target flow.
- Keep ticket status and custody status separate.
- Validate all inputs.
- Preserve authorization checks.
- Avoid exposing secrets or private data.
- Run `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build` after runtime code changes.

## Prompt Rules For Future Agents

Every implementation prompt should start with:

```text
Read docs/PROJECT_DEFINITION.md, docs/ARCHITECTURE.md, docs/SERVICE_DESK_WORKFLOW.md, docs/V2_DATA_MODEL_PLAN.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, and docs/DEVELOPMENT_PLAN.md before making changes.
```

Agents must then:

- List affected files before implementation.
- Explain reasoning and implementation plan.
- Identify risks and edge cases.
- Implement incrementally.
- Add or update tests for important logic.
- Run verification commands.
- Report manual QA steps.
- Avoid unrelated refactors.

## Phase Roadmap

1. Phase 1: Documentation and planning
2. Phase 2: Schema additions
3. Phase 3: Public request and tracking
4. Phase 4: Lead technician triage
5. Phase 5: Technician queue
6. Phase 6: Custody check-in and pickup
7. Phase 7: WhatsApp notification abstraction
8. Phase 8: Reports and cleanup

## Phase 1: Documentation And Planning

### Goal

Reframe the product from a traditional student portal into SIMAD IT Service Desk.

### Scope

- Rewrite project definition around V2 service-desk direction.
- Update architecture around public requester flow and staff-authenticated tools.
- Create the service-desk workflow specification.
- Create the V2 data model plan.
- Define phased implementation order.

### Explicit Non-Goals

- No Prisma schema changes.
- No runtime code changes.
- No UI changes.
- No route changes.
- No removal of existing features.
- No test rewrites.

### Deliverables

- `docs/PROJECT_DEFINITION.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT_PLAN.md`
- `docs/SERVICE_DESK_WORKFLOW.md`
- `docs/V2_DATA_MODEL_PLAN.md`

### Acceptance Criteria

- Documentation clearly reflects the SIMAD IT Service Desk pivot.
- The product direction includes public intake, lead technician triage, technician queue, device custody, WhatsApp-first communication, and admin reporting.
- Existing app remains unchanged.

## Phase 2: Schema Additions

### Goal

Add the V2 data model foundation without removing current MVP behavior.

### Scope

- Add `LEAD_TECHNICIAN` role or equivalent role capability.
- Add ticket severity.
- Add repair method.
- Add V2 ticket statuses if migration strategy confirms safe transition.
- Add requester identity model or requester fields.
- Add custody model.
- Add pickup code fields.
- Add triage metadata.
- Add structured repair/audit events if needed.
- Update seed data for staff roles and representative service-desk scenarios.

### Non-Goals

- Do not remove student account tables or existing ownership assumptions yet.
- Do not remove existing repair ticket pages yet.
- Do not integrate real WhatsApp yet.

### Testing Expectations

- Prisma validation.
- Migration generation/review.
- Seed helper tests.
- Enum/transition tests.
- Backward compatibility tests for existing ticket creation and lookup where applicable.

### Key Risks

- Breaking existing tickets.
- Confusing old statuses with new statuses.
- Creating requester duplication without a lookup strategy.
- Accidentally exposing public requester data.

### Migration Notes

- `20260618120000_add_service_desk_v2_foundation`: additive Prisma migration for the V2 service-desk foundation. Adds requester identity, custody tracking, repair events, severity, repair method, lead technician role support, notification channel additions, nullable public-request ticket fields, and optional `Device.ownerId` for requester-owned public intake devices.

## Phase 3: Public Request And Tracking

### Goal

Allow students and lecturers to submit and track repair requests without login.

### Scope

- Public repair request page.
- Maintenance-week quick intake variant or mode flag.
- Public ticket confirmation page.
- Tracking-code lookup page.
- Safe limited tracking API.
- Optional phone plus tracking-code verification if selected.

### Non-Goals

- Do not remove existing authenticated student ticket creation until public flow is stable.
- Do not expose internal notes.
- Do not build full WhatsApp integration yet.

### Testing Expectations

- Public request validation.
- Tracking code generation.
- Duplicate/invalid request handling where defined.
- Public tracking response excludes internal/private fields.
- Existing authenticated routes still work.

### Manual QA

- Submit normal public request.
- Submit quick intake request.
- Track request by code.
- Verify tracking page hides internal notes and private staff/admin data.

## Phase 4: Lead Technician Triage

### Goal

Build the operational command center for new requests and assignment decisions.

### Scope

- Lead technician role guard.
- New requests queue.
- Triage detail screen.
- Set issue category.
- Set severity.
- Set repair method.
- Request student action.
- Mark waiting for device.
- Assign or reassign technician.
- Escalate or cancel according to policy.

### Non-Goals

- Admin should not become the default dispatcher.
- Technicians should not randomly claim unassigned tickets by default.

### Testing Expectations

- Lead technician access works.
- Non-lead users are blocked from triage actions.
- Severity and repair method validation.
- Assignment creates audit event.
- Student-safe notification event is created when relevant.

## Phase 5: Technician Queue

### Goal

Give technicians a focused workspace for assigned tickets only.

### Scope

- Technician assigned queue.
- Ticket work detail.
- Diagnosis form.
- Repair notes.
- Parts-required notes.
- Allowed status updates.
- Request student action.
- Submit for quality verification.

### Non-Goals

- Technician assignment/reassignment unless explicitly authorized later.
- Full admin reporting.
- Public communication outside notification events.

### Testing Expectations

- Technician sees assigned tickets only.
- Technician cannot access unassigned ticket details.
- Technician can add diagnosis/repair notes for assigned tickets.
- Invalid status transitions are rejected.

## Phase 6: Custody Check-In And Pickup

### Goal

Track physical device responsibility from receipt through collection.

### Scope

- Device check-in screen.
- Condition capture.
- Accessories capture.
- Storage location.
- Optional custody photos.
- Custody lifecycle transitions.
- Ready-for-collection handling.
- Pickup code generation/verification.
- Collection confirmation.

### Non-Goals

- Do not require custody for remote-support tickets.
- Do not expose custody photos publicly.

### Testing Expectations

- Custody can start only for a valid ticket.
- Custody transitions follow allowed lifecycle.
- Pickup requires valid confirmation flow.
- Custody data is visible only to authorized staff.

### Manual QA

- Check in a device with charger.
- Record damaged condition.
- Move to in repair room.
- Mark ready for collection.
- Confirm pickup.
- Verify ticket closes only according to policy.

## Phase 7: WhatsApp Notification Abstraction

### Goal

Create channel-agnostic notifications with WhatsApp as the main requester channel.

### Scope

- Notification event model/service.
- Provider interface.
- Stub/local provider for development.
- WhatsApp provider adapter placeholder.
- Message templates for key events.
- Delivery attempt tracking.
- Failure/retry strategy.

### Key Events

- Ticket received.
- Triage completed.
- Bring device requested.
- Device received.
- Technician assigned.
- Waiting for student.
- Replacement part required.
- Ready for pickup.
- Pickup reminder.
- Ticket closed.

### Non-Goals

- Do not hard-code one vendor deeply into domain logic.
- Do not expose technician personal phone numbers by default.

### Testing Expectations

- Domain actions emit notification events.
- Provider receives normalized payloads.
- Failures are recorded without rolling back core ticket actions unless policy requires it.
- Templates do not leak internal notes.

## Phase 8: Reports And Cleanup

### Goal

Align reports and UI cleanup with the service-desk operating model.

### Scope

- Admin service-desk reports.
- Lead technician workload views.
- Maintenance-week reporting.
- Custody exception reporting.
- Remove or hide obsolete student-dashboard surfaces after replacements are stable.
- Update docs and manual QA runbooks.

### Report Areas

- Repairs by faculty.
- Most common issue categories.
- Technician workload.
- Average triage time.
- Average resolution time.
- Waiting-for-student duration.
- Waiting-for-part duration.
- Ready-for-pickup aging.
- Custody exceptions.
- Maintenance-week throughput.

### Cleanup Candidates

- Student dashboard.
- Student profile management.
- Student notification center.
- Student account settings.
- Required login before ticket submission.
- User-managed device portal, if intake/custody model replaces it.

### Testing Expectations

- Reports are admin-only unless explicitly shared.
- Aggregates exclude private fields.
- Removed/deprecated screens have redirects or clear replacement paths.
- Existing production data remains traceable.

## V2 Final Acceptance Checklist

- Public requester can submit a repair request without an account.
- Requester receives a tracking code.
- Public tracking shows safe limited status.
- Lead technician can triage, prioritize, and assign.
- Technician sees assigned queue only.
- Device custody can be checked in, tracked, and collected.
- Pickup confirmation is recorded.
- WhatsApp notification abstraction exists for key events.
- Admin reports reflect service-desk operations.
- Existing app behavior is not broken during migration.
- Runtime tests pass.
- Typecheck passes.
- Lint passes.
- Build passes.
