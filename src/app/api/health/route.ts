import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "farsamotech-repair-hub",
    stack: "nextjs-prisma-supabase",
  });
}
