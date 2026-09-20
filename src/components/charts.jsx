import React, { useId } from 'react'

const PALETTE = ['#4569c7', '#cc841c', '#10b981', '#f59e0b', '#ef4444', '#8b6fd6']

export function LineChart({ data, height = 180, color = '#4569c7' }) {
  const W = 600
  const H = height
  const pad = 8
  const values = data.map((d) => d.value)
  const max = Math.max(...values, 1)
  const stepX = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0
  const points = data.map((d, i) => {
    const x = pad + i * stepX
    const y = H - pad - (d.value / max) * (H - pad * 2)
    return [x, y]
  })
  const linePoints = points.map(([x, y]) => `${x},${y}`).join(' ')
  const areaPoints = `${pad},${H - pad} ${linePoints} ${W - pad},${H - pad}`
  const gradientId = useId()

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={W - pad} y1={pad + f * (H - pad * 2)} y2={pad + f * (H - pad * 2)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 5" />
        ))}
        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  )
}

export function DonutChart({ data, size = 160, thickness = 22, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total <= 0) return null
  const r = (size - thickness) / 2
  const circumference = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2
  let offset = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        {data.map((d, i) => {
          const fraction = d.value / total
          const dash = fraction * circumference
          const dashoffset = circumference - offset
          offset += dash
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color || PALETTE[i % PALETTE.length]}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap={data.length > 1 ? 'butt' : 'round'}
            />
          )
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && <p className="text-lg font-bold text-slate-900">{centerValue}</p>}
          {centerLabel && <p className="text-[11px] text-slate-400">{centerLabel}</p>}
        </div>
      )}
    </div>
  )
}

export function chartColor(i) {
  return PALETTE[i % PALETTE.length]
}
