import { Card } from "@/components/ui/card"
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"

interface KpiCardProps {
  title: string
  value: string | number
  delta?: number
  trend?: "up" | "down"
}

export function KpiCard({ title, value, delta, trend }: KpiCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trend === "up" ? "text-success" : "text-destructive"}`}>
            {trend === "up" ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
            <span>{Math.abs(delta)}%</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  )
}
