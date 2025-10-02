import { NextResponse } from "next/server"

export async function POST() {
  // Stub API - returns mock authorization URL
  return NextResponse.json({
    authorizationUrl: "https://example.com/mercadopago/authorize",
    preapprovalId: "mock-preapproval-123",
  })
}
