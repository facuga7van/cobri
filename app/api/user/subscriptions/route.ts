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
      .orderBy("createdAt", "desc")
      .get()

    const subscriptions = subsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      nextPayment: doc.data().nextPayment?.toDate?.()?.toISOString() ?? null,
      lastPayment: doc.data().lastPayment?.toDate?.()?.toISOString() ?? null,
    }))

    return NextResponse.json({
      subscriptions,
      total: subscriptions.length,
    })
  } catch (error) {
    console.error("Error in GET /api/user/subscriptions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
