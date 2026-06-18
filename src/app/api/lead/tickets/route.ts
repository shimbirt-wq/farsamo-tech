import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { listLeadTriageQueue } from "@/lib/service-desk/lead-triage";

const LEAD_ROUTE_ROLES = ["LEAD_TECHNICIAN", "ADMIN"] as const;

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedRole(prisma, request, LEAD_ROUTE_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  try {
    const tickets = await listLeadTriageQueue();

    return NextResponse.json({ tickets });
  } catch {
    return internalErrorResponse();
  }
}
