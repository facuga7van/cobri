import { createHmac, timingSafeEqual } from "crypto"

/**
 * Verifies MercadoPago webhook signature.
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  webhookSecret: string
): boolean {
  if (!xSignature || !xRequestId || !webhookSecret) return false

  // Parse x-signature header: "ts=...,v1=..."
  const parts: Record<string, string> = {}
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=", 2)
    if (key && value) parts[key.trim()] = value.trim()
  })

  const ts = parts["ts"]
  const v1 = parts["v1"]
  if (!ts || !v1) return false

  // Build the manifest string
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  // HMAC-SHA256
  const hmac = createHmac("sha256", webhookSecret)
  hmac.update(manifest)
  const generatedHash = hmac.digest("hex")

  try {
    return timingSafeEqual(Buffer.from(generatedHash), Buffer.from(v1))
  } catch {
    return false
  }
}
