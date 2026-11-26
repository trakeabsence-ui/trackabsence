export function cn(...values) {
  return values.filter(Boolean).join(' ')
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatPct(value, digits = 1) {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(digits)}%`
}

export function downloadCsv(filename, rows, headers) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const head = headers ?? Object.keys(rows[0] ?? {})
  const lines = [
    head.join(','),
    ...rows.map((row) => head.map((key) => escape(row[key])).join(',')),
  ]

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const riskMeta = {
  healthy: { label: 'Healthy', tone: 'green' },
  watch: { label: 'Watch', tone: 'amber' },
  at_risk: { label: 'At risk', tone: 'red' },
  critical: { label: 'Critical', tone: 'red' },
}

export function rateTone(rate) {
  if (rate === null || rate === undefined) return 'slate'
  if (rate >= 90) return 'green'
  if (rate >= 80) return 'amber'
  return 'red'
}

export function timeGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
