# Export CSV — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Allow users to export their clients and subscriptions lists as CSV files.

**Architecture:** Client-side CSV generation (no server endpoint needed). Two export buttons on the customers and subscriptions list pages. Uses existing Firestore data already loaded on each page.

**Tech Stack:** Browser Blob API, no external libraries needed.

---

### Task 1: i18n Keys + CSV Utility

**Files:**
- Modify: `messages/es.json`, `messages/en.json`
- Create: `lib/csv-utils.ts`

- [ ] **Step 1: Add i18n keys**

Add to `"common"` namespace in both files:

ES:
```json
"exportCsv": "Exportar CSV"
```

EN:
```json
"exportCsv": "Export CSV"
```

- [ ] **Step 2: Create `lib/csv-utils.ts`**

```typescript
/**
 * Converts an array of objects to a CSV string and triggers download.
 */
export function downloadCsv(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? ""
        const str = String(val)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(",")
    ),
  ]

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/es.json messages/en.json lib/csv-utils.ts
git commit -m "feat: add CSV export utility and i18n key"
```

---

### Task 2: Add Export to Customers Page

**Files:**
- Modify: `app/[locale]/app/customers/page.tsx`

- [ ] **Step 1: Read the current file and add export functionality**

Read the customers list page. Add:

1. Import at top:
```typescript
import { downloadCsv } from "@/lib/csv-utils"
import { IconDownload } from "@tabler/icons-react"
```

2. Add an export handler function inside the component:
```typescript
function handleExportCsv() {
  const csvData = customers.map(c => ({
    Name: c.name,
    Email: c.email,
    Subscriptions: c.subscriptions ?? 0,
    "Total Value": c.totalValue ?? 0,
  }))
  downloadCsv(csvData, "cobri-customers")
}
```

3. Add an "Export CSV" button next to the existing "Add Customer" button in the header:
```tsx
<Button variant="outline" onClick={handleExportCsv}>
  <IconDownload className="h-4 w-4 mr-2" />
  {tCommon('exportCsv')}
</Button>
```

Adapt variable names to match what actually exists in the file (`customers` array, `tCommon`, etc.).

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/app/customers/page.tsx
git commit -m "feat: add CSV export to customers list page"
```

---

### Task 3: Add Export to Subscriptions Page

**Files:**
- Modify: `app/[locale]/app/subscriptions/page.tsx`

- [ ] **Step 1: Read the current file and add export functionality**

Read the subscriptions list page. Add:

1. Import at top:
```typescript
import { downloadCsv } from "@/lib/csv-utils"
import { IconDownload } from "@tabler/icons-react"
```

2. Add export handler:
```typescript
function handleExportCsv() {
  const csvData = subscriptions.map(s => ({
    Customer: s.customerName ?? "—",
    Plan: s.plan,
    Price: s.price,
    "Billing Cycle": s.billingCycle,
    Status: s.status,
    "Next Payment": s.nextPayment ?? "—",
    "Last Payment": s.lastPayment ?? "—",
  }))
  downloadCsv(csvData, "cobri-subscriptions")
}
```

3. Add "Export CSV" button next to "Add Subscription" button:
```tsx
<Button variant="outline" onClick={handleExportCsv}>
  <IconDownload className="h-4 w-4 mr-2" />
  {tCommon('exportCsv')}
</Button>
```

Adapt variable names to match what actually exists in the file.

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/app/subscriptions/page.tsx
git commit -m "feat: add CSV export to subscriptions list page"
```

---

## Task Dependency Graph

```
Task 1 (CSV util + i18n) → Task 2 (customers) | Task 3 (subscriptions)
```

Tasks 2 and 3 can run in parallel.
