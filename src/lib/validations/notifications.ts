import { z } from "zod";

const positiveInteger = z.coerce.number().int().positive();

export const notificationListQuerySchema = z.object({
  page: positiveInteger.default(1),
  pageSize: positiveInteger.max(20).default(10),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
