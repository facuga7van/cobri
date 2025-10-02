import { IconInfoCircle } from "@tabler/icons-react"

export function TrialBanner() {
  return (
    <div className="bg-info/10 border border-info/20 rounded-lg p-4 flex items-center gap-3">
      <IconInfoCircle className="h-5 w-5 text-info flex-shrink-0" />
      <p className="text-sm">
        <span className="font-medium">Trial active:</span> 12 days remaining in your free trial
      </p>
    </div>
  )
}
