import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IconCheck } from "@tabler/icons-react"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold">Cobri</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">One plan with everything you need</p>
        </div>

        <Card className="max-w-lg mx-auto p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Pro Plan</h2>
            <div className="text-5xl font-bold mb-2">
              $5<span className="text-xl text-muted-foreground">/month</span>
            </div>
            <p className="text-muted-foreground">Billed monthly, cancel anytime</p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              "Unlimited subscriptions",
              "Customer management",
              "Revenue tracking & charts",
              "Status monitoring (active, paused, cancelled)",
              "Email notifications",
              "MercadoPago integration",
              "14-day free trial",
              "Priority support",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <IconCheck className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <Link href="/auth/sign-up">
            <Button className="w-full" size="lg">
              Start Free Trial
            </Button>
          </Link>
          <p className="text-xs text-center text-muted-foreground mt-4">No credit card required for trial</p>
        </Card>
      </div>
    </div>
  )
}
