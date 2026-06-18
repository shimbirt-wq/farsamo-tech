import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";

const LEAD_ROUTE_ROLES = ["LEAD_TECHNICIAN", "ADMIN"] as const;

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedRole(prisma, request, LEAD_ROUTE_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  try {
    const technicians = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ["TECHNICIAN", "LEAD_TECHNICIAN"],
        },
      },
      select: {
        id: true,
        fullName: true,
        role: true,
      },
      orderBy: [{ role: "asc" }, { fullName: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({ technicians });
  } catch {
    return internalErrorResponse();
  }
}
