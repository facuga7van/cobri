import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]

  // In production, use GOOGLE_APPLICATION_CREDENTIALS or service account
  // For development, initialize with project config
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    return initializeApp({ credential: cert(serviceAccount), projectId })
  }

  // Fallback: initialize with just project ID (works in Google Cloud environments)
  return initializeApp({ projectId })
}

const adminApp = getAdminApp()

export const adminAuth: Auth = getAuth(adminApp)
export const adminDb: Firestore = getFirestore(adminApp)
