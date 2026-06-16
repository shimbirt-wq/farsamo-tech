# Architecture

## System Overview

FarsamoTech Repair Hub follows a full-stack Next.js architecture:

```text
Student / Lecturer / Technician / Admin
  ->
Next.js App Router UI
  ->
Next.js Route Handlers and Server Modules
  ->
Prisma ORM
  ->
Supabase PostgreSQL
  ->
Reports, Analytics, Notifications, and QR Tracking
```

## Core Layers

### Next.js UI Layer

The UI layer provides role-specific interfaces:

- Student and lecturer repair request forms
- Repair journey timeline
- Technician dashboard
- Admin dashboard
- Analytics and reports views
- Notification center

### Next.js Backend Layer

Route Handlers and server-side modules own business rules and integrations:

- Authentication
- Authorization
- Input validation
- Ticket creation
- Technician assignment
- Repair status transitions
- Repair logs
- Notification triggers
- Report and analytics endpoints
- QR code generation

### Data Access Layer

Prisma provides typed access to Supabase PostgreSQL. PostgreSQL stores normalized operational records for users, devices, tickets, logs, notifications, and technician activity.

## Domain Modules

### Auth

Responsibilities:

- Login
- Token issuance
- Token verification
- Role-based route protection

### Users

Responsibilities:

- Store student, lecturer, technician, and admin profiles
- Enforce unique university IDs and emails
- Support role-based access decisions

### Devices

Responsibilities:

- Store device ownership and identity
- Associate devices with users
- Preserve serial number and model history

### Repair Tickets

Responsibilities:

- Create repair requests
- Generate human-readable ticket IDs
- Link tickets to devices and technicians
- Track repair journey status
- Store issue descriptions and submission metadata

### Repair Logs

Responsibilities:

- Store technician diagnosis notes
- Store repair notes
- Preserve repair timeline history
- Support auditing and reports

### Technician Activity

Responsibilities:

- Track technician check-in and check-out
- Track completed repairs
- Support performance analytics

### Notifications

Responsibilities:

- Create dashboard notification records
- Trigger email notifications
- Prepare future SMS and WhatsApp channels

### Reports and Analytics

Responsibilities:

- Most common problems
- Repairs by faculty
- Repairs by device type
- Monthly repair trends
- Technician performance
- Average repair time

## Repair Journey

Repair status should follow a controlled lifecycle:

1. Registration Completed
2. Device Received
3. Diagnosis in Progress
4. Repair in Progress
5. Quality Inspection
6. Ready for Collection
7. Device Collected

Status changes should be recorded in logs so the platform can show a reliable timeline.

## Data Model Baseline

### users

- `id`
- `full_name`
- `university_id`
- `faculty`
- `department`
- `phone`
- `email`
- `role`

### devices

- `id`
- `owner_id`
- `device_type`
- `brand`
- `model`
- `serial_number`

### repair_tickets

- `id`
- `ticket_id`
- `device_id`
- `technician_id`
- `issue_description`
- `status`
- `created_at`

### repair_logs

- `id`
- `ticket_id`
- `diagnosis`
- `repair_notes`
- `updated_at`

### technician_activity

- `id`
- `technician_id`
- `check_in`
- `check_out`
- `repairs_completed`

## Required API Areas

- `POST /auth/login`
- `POST /users`
- `GET /users/me`
- `POST /devices`
- `GET /devices`
- `POST /repair-tickets`
- `GET /repair-tickets`
- `GET /repair-tickets/:id`
- `PATCH /repair-tickets/:id/status`
- `PATCH /repair-tickets/:id/assign`
- `POST /repair-tickets/:id/logs`
- `GET /reports/overview`
- `GET /reports/technicians`
- `GET /reports/problems`

Exact route names may change during implementation, but the API should preserve these capabilities.

## Authorization Model

- Students and lecturers can create and view their own repair tickets.
- Technicians can view assigned tickets and update repair progress for assigned work.
- Admins can view all records, assign technicians, manage users, and access analytics.
- System-level reports must not expose private user data beyond what the viewer role is allowed to access.

## External Services

### Email Service

Used for repair journey updates and collection readiness notifications.

### QR Code Generator

Used to create ticket QR codes for fast tracking and device lookup.

### Notification Engine

Used to create dashboard notifications and coordinate future email, SMS, or WhatsApp delivery.
