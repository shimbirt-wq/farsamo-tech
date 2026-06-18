-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RepairMethod" AS ENUM ('REMOTE_SUPPORT', 'WALK_IN_SERVICE', 'HARDWARE_REPAIR', 'SOFTWARE_REPAIR');

-- CreateEnum
CREATE TYPE "CustodyStatus" AS ENUM ('NOT_RECEIVED', 'RECEIVED', 'IN_REPAIR_ROOM', 'READY_FOR_COLLECTION', 'COLLECTED');

-- CreateEnum
CREATE TYPE "RequesterType" AS ENUM ('STUDENT', 'LECTURER', 'STAFF', 'OTHER');

-- CreateEnum
CREATE TYPE "RepairEventType" AS ENUM ('TICKET_CREATED', 'TRIAGE_UPDATED', 'STATUS_CHANGED', 'CUSTODY_CHANGED', 'TECHNICIAN_ASSIGNED', 'REPAIR_NOTE_ADDED', 'STUDENT_ACTION_REQUESTED', 'PART_REQUIREMENT_ADDED', 'READY_FOR_PICKUP', 'PICKUP_CONFIRMED', 'TICKET_CLOSED', 'TICKET_CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('TICKET_RECEIVED', 'TRIAGE_COMPLETED', 'BRING_DEVICE_REQUESTED', 'DEVICE_RECEIVED', 'TECHNICIAN_ASSIGNED', 'WAITING_FOR_STUDENT', 'REPLACEMENT_PART_REQUIRED', 'READY_FOR_PICKUP', 'PICKUP_REMINDER', 'TICKET_CLOSED', 'TICKET_CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE 'WHATSAPP';
ALTER TYPE "NotificationChannel" ADD VALUE 'SMS';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'LEAD_TECHNICIAN';

-- AlterTable
ALTER TABLE "devices" ADD COLUMN "asset_tag" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "requester_id" TEXT,
ALTER COLUMN "owner_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "repair_tickets" ADD COLUMN "assigned_at" TIMESTAMP(3),
ADD COLUMN "cancelled_at" TIMESTAMP(3),
ADD COLUMN "closed_at" TIMESTAMP(3),
ADD COLUMN "completed_at" TIMESTAMP(3),
ADD COLUMN "issue_category" TEXT,
ADD COLUMN "part_requirement" TEXT,
ADD COLUMN "pickup_code_hash" TEXT,
ADD COLUMN "ready_for_pickup_at" TIMESTAMP(3),
ADD COLUMN "repair_method" "RepairMethod",
ADD COLUMN "requester_id" TEXT,
ADD COLUMN "severity" "Severity",
ADD COLUMN "student_action_required" TEXT,
ADD COLUMN "tracking_code" TEXT,
ADD COLUMN "triage_notes" TEXT,
ADD COLUMN "triaged_at" TIMESTAMP(3),
ADD COLUMN "triaged_by_id" TEXT;

-- CreateTable
CREATE TABLE "requesters" (
    "id" TEXT NOT NULL,
    "requester_type" "RequesterType" NOT NULL,
    "full_name" TEXT NOT NULL,
    "university_id" TEXT,
    "faculty" TEXT,
    "department" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_custody" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "device_id" TEXT,
    "status" "CustodyStatus" NOT NULL DEFAULT 'NOT_RECEIVED',
    "received_by_id" TEXT,
    "received_at" TIMESTAMP(3),
    "condition" TEXT,
    "screen_condition" TEXT,
    "keyboard_condition" TEXT,
    "battery_condition" TEXT,
    "body_condition" TEXT,
    "accessories" JSONB,
    "storage_location" TEXT,
    "check_in_photo_urls" JSONB,
    "released_by_id" TEXT,
    "ready_for_collection_at" TIMESTAMP(3),
    "collected_by_name" TEXT,
    "collected_by_phone" TEXT,
    "collected_at" TIMESTAMP(3),
    "pickup_code_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_custody_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_events" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" "UserRole",
    "event_type" "RepairEventType" NOT NULL,
    "status_from" TEXT,
    "status_to" TEXT,
    "custody_from" "CustodyStatus",
    "custody_to" "CustodyStatus",
    "note" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "requesters_requester_type_idx" ON "requesters"("requester_type");

-- CreateIndex
CREATE INDEX "requesters_university_id_idx" ON "requesters"("university_id");

-- CreateIndex
CREATE INDEX "requesters_phone_idx" ON "requesters"("phone");

-- CreateIndex
CREATE INDEX "requesters_email_idx" ON "requesters"("email");

-- CreateIndex
CREATE INDEX "requesters_created_at_idx" ON "requesters"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_custody_ticket_id_key" ON "device_custody"("ticket_id");

-- CreateIndex
CREATE INDEX "device_custody_device_id_idx" ON "device_custody"("device_id");

-- CreateIndex
CREATE INDEX "device_custody_status_idx" ON "device_custody"("status");

-- CreateIndex
CREATE INDEX "device_custody_received_by_id_idx" ON "device_custody"("received_by_id");

-- CreateIndex
CREATE INDEX "device_custody_released_by_id_idx" ON "device_custody"("released_by_id");

-- CreateIndex
CREATE INDEX "device_custody_received_at_idx" ON "device_custody"("received_at");

-- CreateIndex
CREATE INDEX "device_custody_ready_for_collection_at_idx" ON "device_custody"("ready_for_collection_at");

-- CreateIndex
CREATE INDEX "device_custody_collected_at_idx" ON "device_custody"("collected_at");

-- CreateIndex
CREATE INDEX "device_custody_created_at_idx" ON "device_custody"("created_at");

-- CreateIndex
CREATE INDEX "repair_events_ticket_id_idx" ON "repair_events"("ticket_id");

-- CreateIndex
CREATE INDEX "repair_events_actor_id_idx" ON "repair_events"("actor_id");

-- CreateIndex
CREATE INDEX "repair_events_event_type_idx" ON "repair_events"("event_type");

-- CreateIndex
CREATE INDEX "repair_events_created_at_idx" ON "repair_events"("created_at");

-- CreateIndex
CREATE INDEX "devices_requester_id_idx" ON "devices"("requester_id");

-- CreateIndex
CREATE INDEX "devices_asset_tag_idx" ON "devices"("asset_tag");

-- CreateIndex
CREATE UNIQUE INDEX "repair_tickets_tracking_code_key" ON "repair_tickets"("tracking_code");

-- CreateIndex
CREATE INDEX "repair_tickets_requester_id_idx" ON "repair_tickets"("requester_id");

-- CreateIndex
CREATE INDEX "repair_tickets_triaged_by_id_idx" ON "repair_tickets"("triaged_by_id");

-- CreateIndex
CREATE INDEX "repair_tickets_issue_category_idx" ON "repair_tickets"("issue_category");

-- CreateIndex
CREATE INDEX "repair_tickets_severity_idx" ON "repair_tickets"("severity");

-- CreateIndex
CREATE INDEX "repair_tickets_repair_method_idx" ON "repair_tickets"("repair_method");

-- CreateIndex
CREATE INDEX "repair_tickets_triaged_at_idx" ON "repair_tickets"("triaged_at");

-- CreateIndex
CREATE INDEX "repair_tickets_assigned_at_idx" ON "repair_tickets"("assigned_at");

-- CreateIndex
CREATE INDEX "repair_tickets_ready_for_pickup_at_idx" ON "repair_tickets"("ready_for_pickup_at");

-- CreateIndex
CREATE INDEX "repair_tickets_closed_at_idx" ON "repair_tickets"("closed_at");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "requesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_tickets" ADD CONSTRAINT "repair_tickets_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "requesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_tickets" ADD CONSTRAINT "repair_tickets_triaged_by_id_fkey" FOREIGN KEY ("triaged_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_custody" ADD CONSTRAINT "device_custody_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "repair_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_custody" ADD CONSTRAINT "device_custody_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_custody" ADD CONSTRAINT "device_custody_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_custody" ADD CONSTRAINT "device_custody_released_by_id_fkey" FOREIGN KEY ("released_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_events" ADD CONSTRAINT "repair_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "repair_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_events" ADD CONSTRAINT "repair_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
