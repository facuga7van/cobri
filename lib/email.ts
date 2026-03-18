import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

let resend: Resend | null = null
if (resendApiKey) {
  resend = new Resend(resendApiKey)
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log(`[Email] Would send to ${to}: ${subject}`)
    return
  }

  try {
    await resend.emails.send({
      from: 'Cobri <noreply@cobri.app>',
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('[Email] Failed to send:', error)
  }
}
