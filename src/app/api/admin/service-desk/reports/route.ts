import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { getServiceDeskReportBundle } from "@/lib/service-desk/service-desk-reports";

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedRole(prisma, request, ["ADMIN", "LEAD_TECHNICIAN"]);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  try {
    const reports = await getServiceDeskReportBundle();

    return Response.json({ reports });
  } catch {
    return internalErrorResponse();
  }
}
