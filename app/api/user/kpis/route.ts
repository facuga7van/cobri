import { NextResponse } from "next/server"

export async function GET() {
  // Stub API - returns mock KPI data
  return NextResponse.json({
    active: 6,
    paused: 2,
    cancelled: 1,
    pending: 2,
    mrr: 4800,
    growth: 12,
  })
}
