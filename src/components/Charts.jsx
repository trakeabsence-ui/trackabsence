import { useId } from 'react'

function smoothPath(points) {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return path
}

/* --------------------------------------------------------------------------
   Line / area chart
   -------------------------------------------------------------------------- */
export function LineChart({
  data,
  height = 240,
  color = '#2563EB',
  suffix = '%',
  min,
  max,
  showArea = true,
  reference,
}) {
  const gradientId = useId().replace(/:/g, '')
  const width = 760
  const pad = { top: 16, right: 18, bottom: 28, left: 40 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const values = data.map((item) => item.value)
  const domainMin = min ?? Math.floor((Math.min(...values) - 5) / 10) * 10
  const domainMax = max ?? Math.ceil((Math.max(...values) + 3) / 10) * 10
  const span = Math.max(1, domainMax - domainMin)

  const points = data.map((item, index) => ({
    x: pad.left + (index / Math.max(1, data.length - 1)) * innerW,
    y: pad.top + innerH - ((item.value - domainMin) / span) * innerH,
    ...item,
  }))

  const path = smoothPath(points)
  const area = `${path} L ${points[points.length - 1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z`
  const ticks = Array.from({ length: 5 }, (_, index) => domainMin + (span / 4) * index)

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Attendance trend: ${data[0]?.value}${suffix} to ${data[data.length - 1]?.value}${suffix}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => {
        const y = pad.top + innerH - ((tick - domainMin) / span) * innerH
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="#EEF2F7"
              strokeDasharray="3 5"
            />
            <text x={pad.left - 9} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94A3B8">
              {Math.round(tick)}
              {suffix}
            </text>
          </g>
        )
      })}

      {reference && (
        <g>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + innerH - ((reference.value - domainMin) / span) * innerH}
            y2={pad.top + innerH - ((reference.value - domainMin) / span) * innerH}
            stroke="#CBD5E1"
            strokeDasharray="5 5"
          />
          <text
            x={width - pad.right}
            y={pad.top + innerH - ((reference.value - domainMin) / span) * innerH - 5}
            textAnchor="end"
            fontSize="9.5"
            fontWeight="600"
            fill="#94A3B8"
          >
            {reference.label}
          </text>
        </g>
      )}

      {showArea && <path d={area} fill={`url(#${gradientId})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((point, index) => {
        const isLast = index === points.length - 1
        return (
          <g key={`${point.label}-${index}`}>
            {isLast && <circle cx={point.x} cy={point.y} r="7" fill={color} opacity="0.15" />}
            <circle
              cx={point.x}
              cy={point.y}
              r={isLast ? 4 : 2.6}
              fill="#fff"
              stroke={color}
              strokeWidth={isLast ? 2.5 : 1.8}
            >
              <title>{`${point.label}: ${point.value}${suffix}`}</title>
            </circle>
            {index % (data.length > 8 ? 2 : 1) === 0 && (
              <text
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="9.5"
                fill="#94A3B8"
              >
                {point.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* --------------------------------------------------------------------------
   Stacked bar chart
   -------------------------------------------------------------------------- */
export function BarChart({ data, height = 230, colors = ['#2563EB', '#D97706', '#DC2626'] }) {
  const width = 760
  const pad = { top: 14, right: 12, bottom: 30, left: 40 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const totals = data.map((item) => item.present + item.late + item.absent)
  const max = Math.ceil(Math.max(...totals) / 100) * 100
  const step = innerW / data.length
  const barW = Math.min(52, step * 0.52)
  const ticks = Array.from({ length: 5 }, (_, index) => (max / 4) * index)

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weekly attendance breakdown">
      {ticks.map((tick) => {
        const y = pad.top + innerH - (tick / max) * innerH
        return (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#EEF2F7" strokeDasharray="3 5" />
            <text x={pad.left - 9} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94A3B8">
              {tick}
            </text>
          </g>
        )
      })}

      {data.map((item, index) => {
        const x = pad.left + step * index + (step - barW) / 2
        const presentH = (item.present / max) * innerH
        const lateH = (item.late / max) * innerH
        const absentH = (item.absent / max) * innerH
        const baseY = pad.top + innerH
        return (
          <g key={item.label}>
            <rect
              x={x}
              y={baseY - presentH}
              width={barW}
              height={Math.max(0, presentH - 2)}
              rx="4"
              fill={colors[0]}
            >
              <title>{`${item.label} · Present ${item.present}`}</title>
            </rect>
            <rect
              x={x}
              y={baseY - presentH - lateH}
              width={barW}
              height={Math.max(0, lateH - 2)}
              rx="3"
              fill={colors[1]}
            >
              <title>{`${item.label} · Late ${item.late}`}</title>
            </rect>
            <rect
              x={x}
              y={baseY - presentH - lateH - absentH}
              width={barW}
              height={Math.max(0, absentH - 2)}
              rx="3"
              fill={colors[2]}
            >
              <title>{`${item.label} · Absent ${item.absent}`}</title>
            </rect>
            <text x={x + barW / 2} y={height - 9} textAnchor="middle" fontSize="10" fill="#94A3B8">
              {item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* --------------------------------------------------------------------------
   Donut
   -------------------------------------------------------------------------- */
export function Donut({
  data,
  size = 168,
  thickness = 20,
  centerValue,
  centerLabel = 'Total',
}) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Distribution: ${data.map((item) => `${item.label} ${item.value}%`).join(', ')}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={thickness}
      />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((item, index) => {
          const length = (item.value / total) * circumference
          const dash = Math.max(0, length - 3)
          const offset = data
            .slice(0, index)
            .reduce((sum, entry) => sum + (entry.value / total) * circumference, 0)
          return (
            <circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            >
              <title>{`${item.label}: ${item.value}%`}</title>
            </circle>
          )
        })}
      </g>
      <text
        x="50%"
        y={centerValue ? '48%' : '52%'}
        textAnchor="middle"
        className="donut-center donut-center__value"
      >
        {centerValue ?? `${total}%`}
      </text>
      <text x="50%" y="61%" textAnchor="middle" className="donut-center donut-center__label">
        {centerLabel}
      </text>
    </svg>
  )
}

/* --------------------------------------------------------------------------
   Progress ring
   -------------------------------------------------------------------------- */
export function ProgressRing({
  value,
  size = 92,
  stroke = 8,
  color = '#60A5FA',
  track = 'rgba(255,255,255,0.14)',
  label,
  sub,
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div className="hero-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="hero-ring__value">
        <strong>{label ?? `${Math.round(value)}%`}</strong>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Sparkline
   -------------------------------------------------------------------------- */
export function Sparkline({ data, width = 88, height = 30, color = '#2563EB' }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = Math.max(1, max - min)
  const points = data.map((value, index) => ({
    x: (index / Math.max(1, data.length - 1)) * width,
    y: height - 3 - ((value - min) / span) * (height - 6),
  }))
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path
        d={smoothPath(points)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* --------------------------------------------------------------------------
   Legend
   -------------------------------------------------------------------------- */
export function ChartLegend({ items }) {
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <span className="chart-legend__item" key={item.label}>
          <span className="legend-dot" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
