import { MercadoPagoConfig, PreApproval } from "mercadopago"

const accessToken = process.env.MP_ACCESS_TOKEN

if (!accessToken) {
  console.warn("MP_ACCESS_TOKEN not set - MercadoPago integration will fail")
}

const client = new MercadoPagoConfig({
  accessToken: accessToken ?? "",
})

export const preApproval = new PreApproval(client)
export { client }
export const mpWebhookSecret = process.env.MP_WEBHOOK_SECRET ?? ""
