import { NextResponse } from "next/server"
import { verifyAuth, isAuthError } from "@/lib/api-auth"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (isAuthError(auth)) return auth

    const { userId } = auth

    // Query subscriptions from Firestore
    const subsSnap = await adminDb
      .collection("users")
      .doc(userId)
      .collection("subscriptions")
      .get()

    let active = 0
    let paused = 0
    let cancelled = 0
    let pending = 0
    let mrr = 0

    subsSnap.forEach((doc) => {
      const data = doc.data()
      switch (data.status) {
        case "authorized":
          active++
          // Calculate MRR
          if (data.price) {
            mrr += data.billingCycle === "yearly" ? data.price / 12 : data.price
          }
          break
        case "paused":
          paused++
          break
        case "cancelled":
          cancelled++
          break
        case "pending":
          pending++
          break
      }
    })

    // Calculate growth (compare current month vs previous month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    let currentMonthNew = 0
    let prevMonthNew = 0

    subsSnap.forEach((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() ?? new Date(0)
      if (createdAt >= startOfMonth) currentMonthNew++
      else if (createdAt >= startOfPrevMonth) prevMonthNew++
    })

    const growth = prevMonthNew > 0
      ? Math.round(((currentMonthNew - prevMonthNew) / prevMonthNew) * 100)
      : currentMonthNew > 0 ? 100 : 0

    return NextResponse.json({
      active,
      paused,
      cancelled,
      pending,
      mrr: Math.round(mrr * 100) / 100,
      growth,
    })
  } catch (error) {
    console.error("Error in GET /api/user/kpis:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
