export type ServiceDeskNotificationEventType =
  | "TICKET_RECEIVED"
  | "TRIAGE_COMPLETED"
  | "BRING_DEVICE_REQUESTED"
  | "DEVICE_RECEIVED"
  | "TECHNICIAN_ASSIGNED"
  | "WAITING_FOR_STUDENT"
  | "REPLACEMENT_PART_REQUIRED"
  | "READY_FOR_PICKUP"
  | "PICKUP_REMINDER"
  | "TICKET_CLOSED"
  | "TICKET_CANCELLED";

export type NotificationTemplateContext = {
  trackingCode?: string | null;
  requesterName?: string | null;
  deviceType?: string | null;
  deviceBrand?: string | null;
  issueCategory?: string | null;
  studentActionRequired?: string | null;
};

export type NotificationTemplate = {
  title: string;
  message: string;
};

function ticketLabel(context: NotificationTemplateContext) {
  return context.trackingCode ? `ticket ${context.trackingCode}` : "your repair ticket";
}

function deviceLabel(context: NotificationTemplateContext) {
  return [context.deviceBrand, context.deviceType].filter(Boolean).join(" ") || "device";
}

export function buildNotificationTemplate(
  eventType: ServiceDeskNotificationEventType,
  context: NotificationTemplateContext = {},
): NotificationTemplate {
  const ticket = ticketLabel(context);
  const device = deviceLabel(context);

  switch (eventType) {
    case "TICKET_RECEIVED":
      return {
        title: "Repair request received",
        message: `We received ${ticket} for your ${device}. The service desk will review it and share the next step.`,
      };
    case "TRIAGE_COMPLETED":
      return {
        title: "Repair request reviewed",
        message: `The service desk reviewed ${ticket}. We will continue with the approved repair workflow.`,
      };
    case "BRING_DEVICE_REQUESTED":
      return {
        title: "Device requested",
        message: `Please bring your ${device} to the service desk so ${ticket} can continue.`,
      };
    case "DEVICE_RECEIVED":
      return {
        title: "Device checked in",
        message: `Your ${device} has been received for ${ticket}. We will keep you updated as work progresses.`,
      };
    case "TECHNICIAN_ASSIGNED":
      return {
        title: "Technician assigned",
        message: `A technician has been assigned to ${ticket}.`,
      };
    case "WAITING_FOR_STUDENT":
      return {
        title: "Student action needed",
        message: context.studentActionRequired
          ? `Action is needed for ${ticket}: ${context.studentActionRequired}`
          : `Action is needed from you before work can continue on ${ticket}.`,
      };
    case "REPLACEMENT_PART_REQUIRED":
      return {
        title: "Replacement part required",
        message: `A replacement part is required before ${ticket} can continue.`,
      };
    case "READY_FOR_PICKUP":
      return {
        title: "Device ready for pickup",
        message: `Your ${device} for ${ticket} is ready for collection at the service desk.`,
      };
    case "PICKUP_REMINDER":
      return {
        title: "Pickup reminder",
        message: `Reminder: your ${device} for ${ticket} is ready for collection.`,
      };
    case "TICKET_CLOSED":
      return {
        title: "Repair ticket closed",
        message: `${ticket} has been closed. Thank you for using the service desk.`,
      };
    case "TICKET_CANCELLED":
      return {
        title: "Repair ticket cancelled",
        message: `${ticket} has been cancelled. Contact the service desk if you need help.`,
      };
  }
}
