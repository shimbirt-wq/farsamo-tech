import { NextResponse } from "next/server";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import {
  createPublicRepairRequest,
  PublicRepairRequestValidationError,
} from "@/lib/service-desk/public-requests";
import { publicRepairRequestInputSchema } from "@/lib/service-desk/validations";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedBody = publicRepairRequestInputSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse("Invalid public repair request data.", parsedBody.error);
  }

  try {
    const result = await createPublicRepairRequest(parsedBody.data);

    return NextResponse.json({ request: result }, { status: 201 });
  } catch (error) {
    if (error instanceof PublicRepairRequestValidationError) {
      return validationErrorResponse("Invalid public repair request data.", error.validationError);
    }

    return internalErrorResponse();
  }
}
