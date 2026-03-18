import { NextResponse } from "next/server"
import { verifyAuth, isAuthError } from "@/lib/api-auth"
import { preApproval } from "@/lib/mercadopago"

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (isAuthError(auth)) return auth

    const { userId } = auth

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL
    if (!origin) {
      console.error("NEXT_PUBLIC_APP_URL is not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const backUrl = `${origin}/es/app`

    const result = await preApproval.create({
      body: {
        reason: "Cobri Pro",
        external_reference: `cobri__${userId}`,
        payer_email: auth.email ?? "",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 5,
          currency_id: "ARS",
        },
        back_url: backUrl,
        status: "pending",
      },
    })

    return NextResponse.json({
      id: result.id,
      initPoint: result.init_point,
      status: result.status,
    })
  } catch (error) {
    console.error("Error in POST /api/billing/subscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
