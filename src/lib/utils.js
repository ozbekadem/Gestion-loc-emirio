export function formatMontant(value) {
  const n = Number(value) || 0
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR')
}

export const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function moisCourant() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function labelMois(moisKey) {
  const [annee, mois] = moisKey.split('-').map(Number)
  return `${MOIS_FR[mois - 1]} ${annee}`
}

export const STATUTS_PAIEMENT = [
  { value: 'paye', label: 'Payé', tone: 'green', cellClass: 'bg-success-100 text-success-700 hover:bg-success-200' },
  { value: 'partiel', label: 'Partiel', tone: 'amber', cellClass: 'bg-warning-100 text-warning-700 hover:bg-warning-200' },
  { value: 'retard', label: 'Retard', tone: 'red', cellClass: 'bg-danger-100 text-danger-700 hover:bg-danger-200' },
  { value: 'attendu', label: 'Attendu', tone: 'slate', cellClass: 'bg-slate-50 text-slate-400 hover:bg-slate-100' },
]

export function statutPaiementInfo(value) {
  return STATUTS_PAIEMENT.find((s) => s.value === value) || STATUTS_PAIEMENT[3]
}
