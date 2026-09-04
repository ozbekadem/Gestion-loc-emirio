import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, Button, Modal, Field, Input, Select } from './ui.jsx'
import { formatMontant, MOIS_FR, STATUTS_PAIEMENT, statutPaiementInfo } from '../lib/utils.js'

const MOIS_ABREGES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function anneesDisponibles(baux, paiements) {
  const annees = new Set([new Date().getFullYear()])
  baux.forEach((b) => {
    if (b.dateDebut) annees.add(new Date(b.dateDebut).getFullYear())
    if (b.dateFin) annees.add(new Date(b.dateFin).getFullYear())
  })
  paiements.forEach((p) => annees.add(Number(p.mois.split('-')[0])))
  return [...annees].sort((a, b) => b - a)
}

export default function GrillePaiements() {
  const { state, paiements } = useStore()
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [filtreImmeuble, setFiltreImmeuble] = useState('')
  const [cellule, setCellule] = useState(null)

  const bauxActifs = state.baux.filter((b) => b.statut === 'actif')
  const annees = anneesDisponibles(state.baux, state.paiements)

  const lignes = useMemo(() => {
    return bauxActifs
      .map((b) => {
        const loc = state.locataires.find((l) => l.id === b.locataireId)
        const bien = state.biens.find((x) => x.id === b.bienId)
        const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
        return { bail: b, loc, bien, immeuble, montant: Number(b.loyer) + Number(b.charges) }
      })
      .filter((l) => !filtreImmeuble || l.immeuble?.id === filtreImmeuble)
  }, [bauxActifs, state.locataires, state.biens, state.immeubles, filtreImmeuble])

  function paiementDe(bailId, moisIndex) {
    const mois = `${annee}-${String(moisIndex + 1).padStart(2, '0')}`
    return state.paiements.find((p) => p.bailId === bailId && p.mois === mois)
  }

  function ouvrirCellule(ligne, moisIndex) {
    const mois = `${annee}-${String(moisIndex + 1).padStart(2, '0')}`
    const existant = paiementDe(ligne.bail.id, moisIndex)
    setCellule({
      bailId: ligne.bail.id,
      mois,
      paiementId: existant?.id,
      montantAttendu: ligne.montant,
      montantPaye: existant?.montantPaye ?? ligne.montant,
      datePaiement: existant?.datePaiement || new Date().toISOString().slice(0, 10),
      statut: existant?.statut || 'attendu',
      label: `${ligne.loc ? `${ligne.loc.prenom} ${ligne.loc.nom}` : 'Locataire'} — ${MOIS_FR[moisIndex]} ${annee}`,
    })
  }

  function enregistrerCellule(e) {
    e.preventDefault()
    const { statut, bailId, mois, paiementId, montantAttendu } = cellule
    if (statut === 'attendu') {
      if (paiementId) paiements.remove(paiementId)
      setCellule(null)
      return
    }
    const payload = {
      bailId,
      mois,
      montantAttendu,
      montantPaye: statut === 'retard' ? 0 : Number(cellule.montantPaye) || 0,
      datePaiement: statut === 'retard' ? '' : cellule.datePaiement,
      statut,
    }
    if (paiementId) paiements.update(paiementId, payload)
    else paiements.add(payload)
    setCellule(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} className="max-w-[8rem]">
          {annees.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        {state.immeubles.length > 0 && (
          <Select value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)} className="max-w-xs">
            <option value="">Tous les immeubles</option>
            {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
          </Select>
        )}
        <div className="ml-auto flex flex-wrap gap-3 text-xs text-slate-500">
          {STATUTS_PAIEMENT.map((s) => (
            <span key={s.value} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded ${s.cellClass.split(' ')[0]}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white pb-2 pr-4 text-left text-slate-500">Locataire</th>
                {MOIS_ABREGES.map((m) => (
                  <th key={m} className="px-1 pb-2 text-center text-xs font-medium text-slate-500">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400">Aucun bail actif pour ce filtre.</td>
                </tr>
              )}
              {lignes.map((ligne) => (
                <tr key={ligne.bail.id} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white py-2 pr-4">
                    <p className="font-medium text-slate-800">{ligne.loc ? `${ligne.loc.prenom} ${ligne.loc.nom}` : '—'}</p>
                    <p className="text-xs text-slate-400">{ligne.bien?.nom}</p>
                  </td>
                  {MOIS_ABREGES.map((_, i) => {
                    const p = paiementDe(ligne.bail.id, i)
                    const info = statutPaiementInfo(p?.statut || 'attendu')
                    return (
                      <td key={i} className="px-1 py-1 text-center">
                        <button
                          onClick={() => ouvrirCellule(ligne, i)}
                          title={`${info.label}${p ? ' — ' + formatMontant(p.montantPaye) : ''}`}
                          className={`h-9 w-full min-w-[3rem] rounded-md text-xs font-medium transition ${info.cellClass}`}
                        >
                          {p?.statut === 'paye' || p?.statut === 'partiel' ? formatMontant(p.montantPaye).replace(' €', '') : info.label[0]}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!cellule}
        onClose={() => setCellule(null)}
        title={cellule?.label}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCellule(null)}>Annuler</Button>
            <Button type="submit" form="form-cellule">Enregistrer</Button>
          </>
        }
      >
        {cellule && (
          <form id="form-cellule" onSubmit={enregistrerCellule} className="space-y-4">
            <Field label="Statut">
              <Select value={cellule.statut} onChange={(e) => setCellule((c) => ({ ...c, statut: e.target.value }))}>
                {STATUTS_PAIEMENT.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
            {(cellule.statut === 'paye' || cellule.statut === 'partiel') && (
              <>
                <Field label="Montant payé (€)">
                  <Input type="number" min="0" value={cellule.montantPaye} onChange={(e) => setCellule((c) => ({ ...c, montantPaye: e.target.value }))} />
                </Field>
                <Field label="Date de paiement">
                  <Input type="date" value={cellule.datePaiement} onChange={(e) => setCellule((c) => ({ ...c, datePaiement: e.target.value }))} />
                </Field>
              </>
            )}
            <p className="text-xs text-slate-400">Montant attendu : {formatMontant(cellule.montantAttendu)}</p>
          </form>
        )}
      </Modal>
    </div>
  )
}
