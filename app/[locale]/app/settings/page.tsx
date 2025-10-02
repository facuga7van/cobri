"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconBrandPaypal } from "@tabler/icons-react"
import { ThemeSwitch } from "@/components/theme-switch"
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">{t('account')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('notifications')}</TabsTrigger>
          <TabsTrigger value="payments">{t('billing')}</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{tAuth('email')}</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">{t('timezone')}</Label>
                <Input id="timezone" defaultValue="UTC-5 (Eastern Time)" />
              </div>
              <div className="pt-4 border-t">
                <ThemeSwitch />
              </div>
              <Button>{tCommon('save')}</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when payments are received</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Failed payment alerts</p>
                  <p className="text-sm text-muted-foreground">Alert me when a payment fails</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New subscription alerts</p>
                  <p className="text-sm text-muted-foreground">Notify me of new subscriptions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cancellation notifications</p>
                  <p className="text-sm text-muted-foreground">Alert me when subscriptions are cancelled</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button>{tCommon('save')}</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Integration</h2>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <IconBrandPaypal className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">MercadoPago</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your MercadoPago account to accept payments and automatically sync subscription status.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
