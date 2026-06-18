import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { requestStudentAction, TechnicianWorkspaceValidationError } from "@/lib/service-desk/technician-workspace";

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

  const body: unknown = await request.json().catch(() => null);
  const { ticketId } = await context.params;

  try {
    const result = await requestStudentAction({
      actor: authResult.user,
      ticketIdOrTrackingCode: ticketId,
      data: body,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ ticket: result.data });
  } catch (error) {
    if (error instanceof TechnicianWorkspaceValidationError) {
      return validationErrorResponse("Invalid student action request data.", error.validationError);
    }

    return internalErrorResponse();
  }
}
