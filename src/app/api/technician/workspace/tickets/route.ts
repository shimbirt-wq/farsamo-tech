import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { listTechnicianQueue } from "@/lib/service-desk/technician-workspace";

const TECHNICIAN_WORKSPACE_ROLES = ["TECHNICIAN", "LEAD_TECHNICIAN", "ADMIN"] as const;

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedRole(prisma, request, TECHNICIAN_WORKSPACE_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  try {
    const tickets = await listTechnicianQueue(authResult.user.id);

    return NextResponse.json({ tickets });
  } catch {
    return internalErrorResponse();
  }
}
