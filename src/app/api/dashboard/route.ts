import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getRoleDashboard } from "@/lib/dashboard/dashboard-service";

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const dashboard = await getRoleDashboard(prisma, authResult.user);

  return Response.json({ dashboard });
}
