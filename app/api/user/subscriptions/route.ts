import { NextResponse } from "next/server"
import { mockSubscriptions } from "@/lib/mock-data"

export async function GET() {
  // Stub API - returns mock subscription list
  return NextResponse.json({
    subscriptions: mockSubscriptions,
    total: mockSubscriptions.length,
  })
}
