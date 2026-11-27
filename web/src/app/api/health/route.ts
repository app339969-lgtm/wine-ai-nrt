import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "SmartRetail Thailand Executive Dashboard",
    dataset: "49,200 clean transactions / 1,000 customers",
  });
}
