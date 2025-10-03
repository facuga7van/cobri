"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useTranslations } from 'next-intl'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const t = useTranslations('theme')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === "dark"

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor="theme-switch" className="font-medium pb-2">
          {t('darkMode')}
        </Label>
        <Switch
        id="theme-switch"
        
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      </div>
    </div>
  )
}

