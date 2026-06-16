import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { createRepairTicket } from "@/lib/repair-tickets/repair-ticket-service";
import { createRepairTicketSchema } from "@/lib/validations/repair-ticket";

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = createRepairTicketSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid repair ticket data.",
        issues: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await createRepairTicket(prisma, authResult.user, parsedBody.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ ticket: result.ticket }, { status: 201 });
}
