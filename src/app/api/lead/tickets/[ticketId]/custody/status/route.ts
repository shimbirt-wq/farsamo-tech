import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { DeviceCustodyValidationError, moveCustodyStatus } from "@/lib/service-desk/device-custody";

const LEAD_CUSTODY_ROLES = ["LEAD_TECHNICIAN", "ADMIN"] as const;

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, LEAD_CUSTODY_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const { ticketId } = await context.params;

  try {
    const result = await moveCustodyStatus({
      actor: authResult.user,
      ticketIdOrTrackingCode: ticketId,
      data: body,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ custody: result.data });
  } catch (error) {
    if (error instanceof DeviceCustodyValidationError) {
      return validationErrorResponse("Invalid custody status transition data.", error.validationError);
    }

    return internalErrorResponse();
  }
}
