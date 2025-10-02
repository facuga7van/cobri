import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status = "authorized" | "paused" | "cancelled" | "pending"

interface StatusBadgeProps {
  status: Status
}

const statusConfig = {
  authorized: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  },
  paused: {
    label: "Paused",
    className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
  },
  pending: {
    label: "Pending",
    className: "bg-info/10 text-info border-info/20 hover:bg-info/20",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
