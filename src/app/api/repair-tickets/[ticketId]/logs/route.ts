import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { addRepairTicketLog } from "@/lib/repair-tickets/repair-ticket-service";
import { createRepairTicketLogSchema } from "@/lib/validations/repair-ticket";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = createRepairTicketLogSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid repair log data.",
        issues: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { ticketId } = await context.params;
  const result = await addRepairTicketLog(prisma, authResult.user, ticketId, parsedBody.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ ticket: result.ticket }, { status: 201 });
}
