import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { listCurrentUserNotifications } from "@/lib/notifications/notification-service";
import { notificationListQuerySchema } from "@/lib/validations/notifications";

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const url = new URL(request.url);
  const parsedQuery = notificationListQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Invalid notification list query.",
        issues: parsedQuery.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await listCurrentUserNotifications(prisma, authResult.user, parsedQuery.data);

  return NextResponse.json(result);
}
