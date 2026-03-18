export function paymentSuccessEmail(customerName: string, plan: string, amount: number) {
  return {
    subject: `Pago recibido: ${customerName} - ${plan}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #18181b; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Cobri</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #16a34a; margin-top: 0;">Pago recibido</h2>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Monto:</strong> $${amount}</p>
          <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
            Este pago fue procesado automáticamente por MercadoPago.
          </p>
        </div>
      </div>
    `,
  }
}

export function paymentCancelledEmail(customerName: string, plan: string) {
  return {
    subject: `Suscripción cancelada: ${customerName} - ${plan}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #18181b; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Cobri</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #ef4444; margin-top: 0;">Suscripción cancelada</h2>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
            La suscripción de este cliente fue cancelada en MercadoPago. No se realizarán más cobros automáticos.
          </p>
        </div>
      </div>
    `,
  }
}
