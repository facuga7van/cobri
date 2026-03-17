import { NextResponse } from "next/server"
import { adminAuth } from "./firebase-admin"

export interface AuthenticatedRequest {
  userId: string
  email?: string
}

/**
 * Verifies the Firebase Auth token from the Authorization header.
 * Returns the decoded user info or a 401 response.
 */
export async function verifyAuth(
  request: Request
): Promise<AuthenticatedRequest | NextResponse> {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    const decoded = await adminAuth.verifyIdToken(token)

    return {
      userId: decoded.uid,
      email: decoded.email,
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    )
  }
}

/**
 * Type guard to check if verifyAuth returned an error response.
 */
export function isAuthError(
  result: AuthenticatedRequest | NextResponse
): result is NextResponse {
  return result instanceof NextResponse
}
