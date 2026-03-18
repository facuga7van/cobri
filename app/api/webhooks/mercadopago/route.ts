import { NextResponse } from "next/server"
import { preApproval, mpWebhookSecret } from "@/lib/mercadopago"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyMercadoPagoSignature } from "@/lib/webhook-verify"

/**
 * MercadoPago Webhook Handler
 *
 * Configure in MercadoPago Dashboard:
 * URL: https://your-domain.com/api/webhooks/mercadopago
 * Events: subscription_preapproval
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    // Verify webhook signature
    const xSignature = request.headers.get("x-signature")
    const xRequestId = request.headers.get("x-request-id")
    const url = new URL(request.url)
    const dataId = url.searchParams.get("data.id") ?? body?.data?.id?.toString() ?? ""

    if (mpWebhookSecret) {
      if (!verifyMercadoPagoSignature(xSignature, xRequestId, dataId, mpWebhookSecret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } else {
      console.warn("MP_WEBHOOK_SECRET not set — webhook signature verification is DISABLED")
    }

    const { type, data } = body

    // Only handle preapproval (subscription) events
    if (type !== "subscription_preapproval" || !data?.id) {
      // Acknowledge other event types without processing
      return NextResponse.json({ received: true })
    }

    // Fetch the preapproval details from MercadoPago
    const preapprovalData = await preApproval.get({ id: data.id })

    if (!preapprovalData?.external_reference) {
      console.warn("Webhook: no external_reference in preapproval", data.id)
      return NextResponse.json({ received: true })
    }

    // Check if this is a Cobri platform subscription (not a client subscription)
    if (preapprovalData.external_reference.startsWith("cobri__")) {
      const cobriUserId = preapprovalData.external_reference.replace("cobri__", "")
      if (!cobriUserId) {
        return NextResponse.json({ received: true })
      }

      // Map status for platform subscription
      let platformStatus: string
      switch (preapprovalData.status) {
        case "authorized": platformStatus = "authorized"; break
        case "paused": platformStatus = "paused"; break
        case "cancelled": platformStatus = "cancelled"; break
        default: platformStatus = "trial"; break
      }

      // Update user's subscriptionStatus directly
      const userRef = adminDb.collection("users").doc(cobriUserId)
      await userRef.update({ subscriptionStatus: platformStatus })

      console.log(`Webhook: updated Cobri platform subscription for user ${cobriUserId} to ${platformStatus}`)
      return NextResponse.json({ received: true, status: platformStatus })
    }

    // Parse external_reference: "userId__subscriptionId"
    const [userId, subscriptionId] = preapprovalData.external_reference.split("__")
    if (!userId || !subscriptionId) {
      console.warn("Webhook: invalid external_reference format", preapprovalData.external_reference)
      return NextResponse.json({ received: true })
    }

    const subRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("subscriptions")
      .doc(subscriptionId)

    const subSnap = await subRef.get()
    if (!subSnap.exists) {
      console.warn("Webhook: subscription not found", userId, subscriptionId)
      return NextResponse.json({ received: true })
    }

    // Idempotency check: skip if this exact event state was already processed
    const currentData = subSnap.data()!
    if (currentData.mercadopagoId === data.id && currentData.mercadopagoStatus === preapprovalData.status) {
      // Already processed this exact state — skip
      return NextResponse.json({ received: true, status: currentData.status })
    }

    // Map MercadoPago status to Cobri status
    const mpStatus = preapprovalData.status
    let cobriStatus: string
    switch (mpStatus) {
      case "authorized":
        cobriStatus = "authorized"
        break
      case "paused":
        cobriStatus = "paused"
        break
      case "cancelled":
        cobriStatus = "cancelled"
        break
      case "pending":
      default:
        cobriStatus = "pending"
        break
    }

    const updateData: Record<string, any> = {
      status: cobriStatus,
      mercadopagoStatus: mpStatus,
      mercadopagoId: data.id,
    }

    // If authorized, record as a payment
    if (cobriStatus === "authorized") {
      const now = new Date()
      updateData.lastPayment = now

      // Calculate next payment date
      const subData = subSnap.data()!
      const billingCycle = subData.billingCycle ?? "monthly"
      const nextPayment = new Date(now)
      if (billingCycle === "yearly") {
        nextPayment.setFullYear(nextPayment.getFullYear() + 1)
      } else {
        nextPayment.setMonth(nextPayment.getMonth() + 1)
      }
      updateData.nextPayment = nextPayment

      // Add payment record — use mercadopagoId as document ID for built-in idempotency
      await subRef.collection("payments").doc(data.id).set({
        date: now,
        amount: subData.price ?? 0,
        source: "mercadopago",
        mercadopagoId: data.id,
      }, { merge: true })

      // Update customer counters if needed
      if (subData.customerId) {
        const customerRef = adminDb
          .collection("users")
          .doc(userId)
          .collection("customers")
          .doc(subData.customerId)

        const customerSnap = await customerRef.get()
        if (customerSnap.exists) {
          // Only increment totalValue if this is a status change to authorized
          const previousStatus = subData.status
          if (previousStatus !== "authorized") {
            const monthlyValue = billingCycle === "yearly"
              ? (subData.price ?? 0) / 12
              : (subData.price ?? 0)
            await customerRef.update({
              totalValue: FieldValue.increment(monthlyValue),
            })
          }
        }
      }
    }

    // If cancelled, decrement customer MRR
    if (cobriStatus === "cancelled") {
      const subData = subSnap.data()!
      if (subData.customerId && subData.status === "authorized") {
        const billingCycle = subData.billingCycle ?? "monthly"
        const monthlyValue = billingCycle === "yearly"
          ? (subData.price ?? 0) / 12
          : (subData.price ?? 0)
        const customerRef = adminDb
          .collection("users")
          .doc(userId)
          .collection("customers")
          .doc(subData.customerId)
        await customerRef.update({
          totalValue: FieldValue.increment(-monthlyValue),
        })
      }
    }

    await subRef.update(updateData)

    console.log(`Webhook: updated subscription ${subscriptionId} to ${cobriStatus}`)
    return NextResponse.json({ received: true, status: cobriStatus })
  } catch (error: any) {
    console.error("Error in webhook /api/webhooks/mercadopago:", error)
    // Return 200 to prevent MercadoPago from retrying
    return NextResponse.json({ error: "Processing error" }, { status: 200 })
  }
}
