import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { IconArrowLeft, IconMail, IconCalendar } from "@tabler/icons-react"
import Link from "next/link"
import { mockSubscriptions } from "@/lib/mock-data"

export default function SubscriptionDetailPage({ params }: { params: { id: string } }) {
  const subscription = mockSubscriptions.find((s) => s.id === params.id) || mockSubscriptions[0]

  const events = [
    { date: "2025-01-15", type: "Payment received", amount: subscription.amount },
    { date: "2024-12-15", type: "Payment received", amount: subscription.amount },
    { date: "2024-11-15", type: "Payment received", amount: subscription.amount },
    { date: "2024-10-20", type: "Subscription created", amount: null },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/subscriptions">
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{subscription.customerName}</h1>
          <p className="text-muted-foreground">{subscription.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <IconMail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{subscription.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconCalendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Customer since</p>
                <p className="font-medium">Oct 20, 2024</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">{subscription.plan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium">${subscription.amount}/month</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge status={subscription.status} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next payment</p>
              <p className="font-medium">{subscription.nextPayment}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Event History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Event History</h2>
        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium">{event.type}</p>
                <p className="text-sm text-muted-foreground">{event.date}</p>
              </div>
              {event.amount && <p className="font-medium">${event.amount}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
