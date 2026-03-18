/**
 * Parses a Firestore date field into a Date object.
 */
function parseDate(input: any): Date | null {
  if (!input) return null
  if (typeof input?.toDate === "function") return input.toDate()
  if (typeof input?.seconds === "number") return new Date(input.seconds * 1000)
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Returns true if the user's trial has expired.
 */
export function isTrialExpired(status: string | null, trialEndsAt: any): boolean {
  if (status !== "trial") return false
  const end = parseDate(trialEndsAt)
  if (!end) return false
  return end.getTime() < Date.now()
}

/**
 * Returns true if the user has an active paid subscription.
 */
export function isPaidUser(status: string | null): boolean {
  return status === "authorized"
}

/**
 * Returns days remaining in trial, or 0 if expired/not in trial.
 */
export function trialDaysLeft(status: string | null, trialEndsAt: any): number {
  if (status !== "trial") return 0
  const end = parseDate(trialEndsAt)
  if (!end) return 0
  const diff = end.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
