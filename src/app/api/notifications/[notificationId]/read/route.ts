import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { markNotificationAsRead } from "@/lib/notifications/notification-service";

type RouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const { notificationId } = await context.params;
  const result = await markNotificationAsRead(prisma, authResult.user, notificationId);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ notification: result.notification });
}
