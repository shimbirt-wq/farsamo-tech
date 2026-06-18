import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { checkInDevice, DeviceCustodyValidationError, getCustodyForTicket } from "@/lib/service-desk/device-custody";

const LEAD_CUSTODY_ROLES = ["LEAD_TECHNICIAN", "ADMIN"] as const;

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, LEAD_CUSTODY_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const { ticketId } = await context.params;

  try {
    const result = await getCustodyForTicket(ticketId);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ custody: result.data });
  } catch {
    return internalErrorResponse();
  }
}

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, LEAD_CUSTODY_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const { ticketId } = await context.params;

  try {
    const result = await checkInDevice({
      actor: authResult.user,
      ticketIdOrTrackingCode: ticketId,
      data: body,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ custody: result.data }, { status: 201 });
  } catch (error) {
    if (error instanceof DeviceCustodyValidationError) {
      return validationErrorResponse("Invalid device custody check-in data.", error.validationError);
    }

    return internalErrorResponse();
  }
}
