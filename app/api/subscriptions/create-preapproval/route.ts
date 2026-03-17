import { NextResponse } from "next/server"
import { verifyAuth, isAuthError } from "@/lib/api-auth"
import { preApproval } from "@/lib/mercadopago"
import { adminDb } from "@/lib/firebase-admin"
import { z } from "zod"

const createPreapprovalSchema = z.object({
  subscriptionId: z.string().min(1),
  customerEmail: z.string().email(),
  plan: z.string().min(1),
  price: z.number().positive(),
  billingCycle: z.enum(["monthly", "yearly"]),
})

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (isAuthError(auth)) return auth

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const parsed = createPreapprovalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { subscriptionId, customerEmail, plan, price, billingCycle } = parsed.data
    const { userId } = auth

    // Determine frequency based on billing cycle
    const frequency = billingCycle === "yearly" ? 12 : 1
    const frequencyType = "months"

    // Build callback URL
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const backUrl = `${origin}/es/app/subscriptions`

    // Create MercadoPago preapproval (subscription)
    const result = await preApproval.create({
      body: {
        reason: plan,
        external_reference: `${userId}__${subscriptionId}`,
        payer_email: customerEmail,
        auto_recurring: {
          frequency,
          frequency_type: frequencyType,
          transaction_amount: price,
          currency_id: "ARS",
        },
        back_url: backUrl,
        status: "pending",
      },
    })

    // Save MercadoPago preapproval ID to the subscription document
    await adminDb
      .collection("users")
      .doc(userId)
      .collection("subscriptions")
      .doc(subscriptionId)
      .update({
        mercadopagoId: result.id,
        mercadopagoStatus: result.status,
      })

    return NextResponse.json({
      id: result.id,
      initPoint: result.init_point,
      status: result.status,
    })
  } catch (error: any) {
    console.error("Error in POST /api/subscriptions/create-preapproval:", error)
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 }
    )
  }
}
