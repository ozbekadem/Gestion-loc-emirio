import React from 'react'

// Primitives partagées, stylées selon le design system "Clarté" (soft UI à
// cartes, mobile-first — voir docs/ARCHITECTURE.md). Les noms de props
// restent inchangés pour que toutes les pages existantes continuent de
// fonctionner sans modification ; seul le rendu visuel change.

export function Button({ variant = 'primary', round = false, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]'
  const taille = round ? 'h-11 w-11 shrink-0 p-0' : 'px-5 py-2.5 text-sm'
  const variants = {
    primary: 'bg-gradient-brand text-white shadow-soft hover:shadow-glow-brand hover:brightness-110',
    secondary: 'bg-white text-slate-700 border border-slate-200 shadow-soft hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-700',
    danger: 'bg-danger-500/10 text-danger-600 hover:bg-danger-500/15',
    ghost: round ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800',
    accent: 'bg-gradient-accent text-white shadow-soft hover:shadow-glow-accent hover:brightness-110',
  }
  return <button className={`${base} ${taille} ${variants[variant] || variants.primary} ${className}`} {...props} />
}

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-3xl border border-slate-200/70 bg-white p-5 shadow-soft ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, action, icon }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-lg shadow-glow-brand">
            <span aria-hidden className="drop-shadow-sm">{icon}</span>
          </span>
        )}
        <div>
          <h1 className="text-[28px] font-extrabold leading-[35px] tracking-[-0.025em] text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// "Suivi" : étiquette de statut toujours accompagnée d'un mot (jamais la
// couleur seule), fond teinté ~12-15 %, texte de la même couleur en gras.
export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 before:bg-slate-400',
    green: 'bg-success-100 text-success-700 before:bg-success-500',
    red: 'bg-danger-100 text-danger-700 before:bg-danger-500',
    amber: 'bg-warning-100 text-warning-700 before:bg-warning-500',
    blue: 'bg-brand-50 text-brand-700 before:bg-brand-600',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold before:h-1.5 before:w-1.5 before:rounded-full ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  )
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-gradient-mesh bg-slate-50/60 px-6 py-14 text-center">
      <p className="font-bold text-slate-700">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {action}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}

// "Champ" : 48px de haut, radius-2xl, fond surface-2, sans bordure visible ;
// 16px (évite le zoom automatique sur iPhone au focus).
const inputClass = 'w-full rounded-2xl border border-transparent bg-slate-100 px-4 py-3 text-base text-slate-900 transition-all duration-150 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-600/15'

// Un `className` fourni par l'appelant (très courant pour les filtres,
// ex. `className="max-w-xs"`) s'ajoute au style de base au lieu de le
// remplacer entièrement.
export function Input({ className = '', ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />
}

export function Select({ className = '', ...props }) {
  return <select className={`${inputClass} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${inputClass} ${className}`} rows={3} {...props} />
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeUp" style={{ animationDuration: '.18s' }}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-soft-lg animate-fadeUp">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

const STAT_TONE = {
  slate: { text: 'text-slate-900', chip: 'bg-slate-100 text-slate-500', bg: '' },
  green: { text: 'text-success-600', chip: 'bg-success-100 text-success-600', bg: 'bg-gradient-card-success' },
  red: { text: 'text-danger-600', chip: 'bg-danger-100 text-danger-600', bg: 'bg-gradient-card-danger' },
  amber: { text: 'text-warning-600', chip: 'bg-warning-100 text-warning-600', bg: 'bg-gradient-card-accent' },
  blue: { text: 'text-brand-600', chip: 'bg-brand-50 text-brand-600', bg: 'bg-gradient-card-brand' },
}

export function StatCard({ label, value, tone = 'slate', hint, icon, trend }) {
  const t = STAT_TONE[tone] || STAT_TONE.slate
  return (
    <Card className={`relative overflow-hidden ${t.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${t.chip}`} aria-hidden>{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-[26px] font-extrabold leading-[26px] tabular-nums ${t.text}`}>{value}</p>
        {trend && Number.isFinite(trend.value) && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trend.value > 0 ? 'text-success-600' : trend.value < 0 ? 'text-danger-600' : 'text-slate-400'}`}>
            {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'}
            {Math.abs(trend.value)}{trend.suffix || ''}
          </span>
        )}
      </div>
      {(hint || trend?.label) && <p className="mt-1 text-xs text-slate-400">{hint || trend.label}</p>}
    </Card>
  )
}
