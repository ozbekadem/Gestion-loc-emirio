import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, StatCard, Select } from '../components/ui.jsx'
import { formatMontant, MOIS_FR } from '../lib/utils.js'

function anneesDisponibles(paiements, travaux) {
  const annees = new Set([new Date().getFullYear()])
  paiements.forEach((p) => annees.add(Number(p.mois.split('-')[0])))
  travaux.forEach((t) => t.date && annees.add(new Date(t.date).getFullYear()))
  return [...annees].sort((a, b) => b - a)
}

export default function Comptabilite() {
  const { state } = useStore()
  const [annee, setAnnee] = useState(new Date().getFullYear())

  const annees = anneesDisponibles(state.paiements, state.travaux)

  const parMois = useMemo(() => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ mois: i, revenus: 0, depenses: 0 }))
    state.paiements
      .filter((p) => p.statut === 'paye' && Number(p.mois.split('-')[0]) === annee)
      .forEach((p) => {
        const m = Number(p.mois.split('-')[1]) - 1
        rows[m].revenus += Number(p.montantPaye) || 0
      })
    state.travaux
      .filter((t) => t.date && new Date(t.date).getFullYear() === annee)
      .forEach((t) => {
        const m = new Date(t.date).getMonth()
        rows[m].depenses += Number(t.cout) || 0
      })
    return rows
  }, [state.paiements, state.travaux, annee])

  const totalRevenus = parMois.reduce((s, r) => s + r.revenus, 0)
  const totalDepenses = parMois.reduce((s, r) => s + r.depenses, 0)

  return (
    <div>
      <PageHeader
        title="Comptabilité"
        subtitle="Bilan annuel des loyers encaissés et des dépenses"
        action={
          <Select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} className="max-w-[8rem]">
            {annees.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Revenus locatifs" value={formatMontant(totalRevenus)} tone="green" />
        <StatCard label="Dépenses (travaux)" value={formatMontant(totalDepenses)} tone="red" />
        <StatCard label="Résultat net" value={formatMontant(totalRevenus - totalDepenses)} tone={totalRevenus - totalDepenses >= 0 ? 'blue' : 'red'} />
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Bilan annuel {annee}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2 pr-4">Mois</th>
                <th className="pb-2 pr-4">Revenus</th>
                <th className="pb-2 pr-4">Dépenses</th>
                <th className="pb-2 pr-4">Solde</th>
              </tr>
            </thead>
            <tbody>
              {parMois.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-2 pr-4 text-slate-700">{MOIS_FR[i]}</td>
                  <td className="py-2 pr-4 text-emerald-600">{formatMontant(r.revenus)}</td>
                  <td className="py-2 pr-4 text-red-600">{formatMontant(r.depenses)}</td>
                  <td className="py-2 pr-4 font-medium text-slate-800">{formatMontant(r.revenus - r.depenses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
