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

function immeubleDuBail(state, bailId) {
  const bail = state.baux.find((b) => b.id === bailId)
  const bien = bail ? state.biens.find((b) => b.id === bail.bienId) : null
  return bien?.immeubleId || null
}

function immeubleDuTravail(t) {
  return t.immeubleId || null
}

export default function Comptabilite() {
  const { state } = useStore()
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [filtreImmeuble, setFiltreImmeuble] = useState('')

  const annees = anneesDisponibles(state.paiements, state.travaux)

  const paiementsAnnee = useMemo(
    () => state.paiements.filter((p) => (p.statut === 'paye' || p.statut === 'partiel') && Number(p.mois.split('-')[0]) === annee),
    [state.paiements, annee],
  )
  const travauxAnnee = useMemo(
    () => state.travaux.filter((t) => t.date && new Date(t.date).getFullYear() === annee),
    [state.travaux, annee],
  )

  const parMois = useMemo(() => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ mois: i, revenus: 0, depenses: 0 }))
    paiementsAnnee
      .filter((p) => !filtreImmeuble || immeubleDuBail(state, p.bailId) === filtreImmeuble)
      .forEach((p) => {
        const m = Number(p.mois.split('-')[1]) - 1
        rows[m].revenus += Number(p.montantPaye) || 0
      })
    travauxAnnee
      .filter((t) => !filtreImmeuble || immeubleDuTravail(t) === filtreImmeuble)
      .forEach((t) => {
        const m = new Date(t.date).getMonth()
        rows[m].depenses += Number(t.cout) || 0
      })
    return rows
  }, [paiementsAnnee, travauxAnnee, filtreImmeuble, state])

  const parImmeuble = useMemo(() => {
    return state.immeubles.map((im) => {
      const revenus = paiementsAnnee
        .filter((p) => immeubleDuBail(state, p.bailId) === im.id)
        .reduce((s, p) => s + (Number(p.montantPaye) || 0), 0)
      const depenses = travauxAnnee
        .filter((t) => immeubleDuTravail(t) === im.id)
        .reduce((s, t) => s + (Number(t.cout) || 0), 0)
      return { immeuble: im, revenus, depenses }
    })
  }, [state, paiementsAnnee, travauxAnnee])

  const totalRevenus = parMois.reduce((s, r) => s + r.revenus, 0)
  const totalDepenses = parMois.reduce((s, r) => s + r.depenses, 0)

  return (
    <div>
      <PageHeader
        title="Comptabilité"
        subtitle="Bilan annuel des loyers encaissés et des dépenses"
        action={
          <div className="flex items-center gap-2">
            {state.immeubles.length > 0 && (
              <Select value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)} className="max-w-xs">
                <option value="">Tous les immeubles</option>
                {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
              </Select>
            )}
            <Select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} className="max-w-[8rem]">
              {annees.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Revenus locatifs" value={formatMontant(totalRevenus)} tone="green" />
        <StatCard label="Dépenses (travaux)" value={formatMontant(totalDepenses)} tone="red" />
        <StatCard label="Résultat net" value={formatMontant(totalRevenus - totalDepenses)} tone={totalRevenus - totalDepenses >= 0 ? 'blue' : 'red'} />
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Bilan annuel {annee}{filtreImmeuble ? ` — ${state.immeubles.find((im) => im.id === filtreImmeuble)?.nom}` : ''}</h2>
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

      {!filtreImmeuble && state.immeubles.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Répartition par immeuble — {annee}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Immeuble</th>
                  <th className="pb-2 pr-4">Revenus</th>
                  <th className="pb-2 pr-4">Dépenses</th>
                  <th className="pb-2 pr-4">Solde</th>
                </tr>
              </thead>
              <tbody>
                {parImmeuble.map(({ immeuble, revenus, depenses }) => (
                  <tr key={immeuble.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{immeuble.nom}</td>
                    <td className="py-2 pr-4 text-emerald-600">{formatMontant(revenus)}</td>
                    <td className="py-2 pr-4 text-red-600">{formatMontant(depenses)}</td>
                    <td className="py-2 pr-4 font-medium text-slate-800">{formatMontant(revenus - depenses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
