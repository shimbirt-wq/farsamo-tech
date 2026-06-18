import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { submitForQualityCheck } from "@/lib/service-desk/technician-workspace";

const TECHNICIAN_WORKSPACE_ROLES = ["TECHNICIAN", "LEAD_TECHNICIAN", "ADMIN"] as const;

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, TECHNICIAN_WORKSPACE_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const { ticketId } = await context.params;

  try {
    const result = await submitForQualityCheck({
      actor: authResult.user,
      ticketIdOrTrackingCode: ticketId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ ticket: result.data });
  } catch {
    return internalErrorResponse();
  }
}
