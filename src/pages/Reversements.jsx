import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, StatCard, Button, Modal, Field, Input, Select, Badge, EmptyState } from '../components/ui.jsx'
import { formatMontant, formatDate, labelMois, moisCourant, montantAReverser, statutReversement, STATUTS_REVERSEMENT } from '../lib/utils.js'

const FILTRES_STATUT = [
  { value: '', label: 'Tous les statuts' },
  { value: 'a_reverser', label: 'À reverser' },
  { value: 'reverse', label: 'Reversé' },
]

export default function Reversements() {
  const { state, paiements, messages } = useStore()
  const [filtreImmeuble, setFiltreImmeuble] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [recherche, setRecherche] = useState('')
  const [modal, setModal] = useState(null)

  const toutesLesLignes = useMemo(() => {
    return state.paiements
      .filter((p) => p.statut === 'paye' || p.statut === 'partiel')
      .map((p) => {
        const bail = state.baux.find((b) => b.id === p.bailId)
        const loc = bail ? state.locataires.find((l) => l.id === bail.locataireId) : null
        const bien = bail ? state.biens.find((x) => x.id === bail.bienId) : null
        const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
        return { paiement: p, bail, loc, bien, immeuble, statutRev: statutReversement(p), net: montantAReverser(p) }
      })
  }, [state.paiements, state.baux, state.locataires, state.biens, state.immeubles])

  const lignes = useMemo(() => {
    return toutesLesLignes
      .filter((l) => !filtreImmeuble || l.immeuble?.id === filtreImmeuble)
      .filter((l) => !filtreStatut || l.statutRev === filtreStatut)
      .filter((l) => !recherche || `${l.loc?.prenom} ${l.loc?.nom}`.toLowerCase().includes(recherche.toLowerCase()))
      .sort((a, b) => {
        if (a.statutRev !== b.statutRev) return a.statutRev === 'a_reverser' ? -1 : 1
        if (a.statutRev === 'a_reverser') return (a.paiement.datePaiement || '').localeCompare(b.paiement.datePaiement || '')
        return (b.paiement.dateReversement || '').localeCompare(a.paiement.dateReversement || '')
      })
  }, [toutesLesLignes, filtreImmeuble, filtreStatut, recherche])

  const mois = moisCourant()
  const enAttente = toutesLesLignes.filter((l) => l.statutRev === 'a_reverser')
  const totalEnAttente = enAttente.reduce((s, l) => s + l.net, 0)
  const reverseCeMois = toutesLesLignes.filter((l) => l.statutRev === 'reverse' && (l.paiement.dateReversement || '').startsWith(mois))
  const totalReverseCeMois = reverseCeMois.reduce((s, l) => s + l.net, 0)
  const fraisGestionMois = toutesLesLignes
    .filter((l) => (l.paiement.datePaiement || '').startsWith(mois))
    .reduce((s, l) => s + (Number(l.paiement.fraisGestion) || 0), 0)

  const immeubleSelectionne = filtreImmeuble ? state.immeubles.find((im) => im.id === filtreImmeuble) : null

  function ouvrirMarquerReverse(ligne) {
    setModal({ ligne, dateReversement: new Date().toISOString().slice(0, 10) })
  }

  function confirmerReversement(e) {
    e.preventDefault()
    const { ligne, dateReversement } = modal
    paiements.update(ligne.paiement.id, { dateReversement })
    if (ligne.immeuble?.proprietaireNom) {
      messages.add({
        immeubleId: ligne.immeuble.id,
        destinataire: 'proprietaire',
        canal: 'virement',
        sujet: `Reversement — ${labelMois(ligne.paiement.mois)}`,
        contenu: `Virement envoyé le ${formatDate(dateReversement)} pour le loyer de ${ligne.loc ? `${ligne.loc.prenom} ${ligne.loc.nom}` : 'locataire'} (${labelMois(ligne.paiement.mois)}) : ${formatMontant(ligne.net)} net des frais de gestion (${formatMontant(ligne.paiement.fraisGestion)}).`,
        date: dateReversement,
        sens: 'envoye',
      })
    }
    setModal(null)
  }

  function genererReleve() {
    if (!immeubleSelectionne) return
    const lignesReleve = toutesLesLignes
      .filter((l) => l.immeuble?.id === immeubleSelectionne.id)
      .sort((a, b) => (a.paiement.mois || '').localeCompare(b.paiement.mois || ''))
    const totalRecu = lignesReleve.reduce((s, l) => s + (Number(l.paiement.montantPaye) || 0), 0)
    const totalFrais = lignesReleve.reduce((s, l) => s + (Number(l.paiement.fraisGestion) || 0), 0)
    const totalNet = lignesReleve.reduce((s, l) => s + l.net, 0)
    const texte = [
      'RELEVÉ DE GESTION LOCATIVE',
      '',
      `Immeuble : ${immeubleSelectionne.nom} — ${immeubleSelectionne.adresse}, ${immeubleSelectionne.codePostal} ${immeubleSelectionne.ville}`,
      `Propriétaire : ${immeubleSelectionne.proprietaireNom || 'non renseigné'}`,
      `Édité le ${formatDate(new Date().toISOString())}`,
      '',
      'Mois        Locataire                Reçu le       Loyer perçu   Frais gestion   Net reversé   Statut',
      '-'.repeat(100),
      ...lignesReleve.map((l) => {
        const nomLoc = l.loc ? `${l.loc.prenom} ${l.loc.nom}` : '—'
        const statutLabel = l.statutRev === 'reverse' ? `Reversé le ${formatDate(l.paiement.dateReversement)}` : 'À reverser'
        return `${labelMois(l.paiement.mois).padEnd(12)}${nomLoc.padEnd(25)}${formatDate(l.paiement.datePaiement).padEnd(15)}${formatMontant(l.paiement.montantPaye).padEnd(14)}${formatMontant(l.paiement.fraisGestion).padEnd(16)}${formatMontant(l.net).padEnd(14)}${statutLabel}`
      }),
      '-'.repeat(100),
      `TOTAL                                              ${formatMontant(totalRecu).padEnd(14)}${formatMontant(totalFrais).padEnd(16)}${formatMontant(totalNet)}`,
      '',
      `Soit ${formatMontant(totalNet)} net reversé (ou à reverser) au propriétaire, après déduction de ${formatMontant(totalFrais)} de frais de gestion sur ${formatMontant(totalRecu)} de loyers perçus.`,
    ].join('\n')
    const blob = new Blob([texte], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `releve-gestion-${immeubleSelectionne.nom.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Reversements propriétaires"
        subtitle="Suivi des loyers encaissés à reverser aux propriétaires, après déduction des frais de gestion"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="En attente de reversement" value={formatMontant(totalEnAttente)} tone={enAttente.length > 0 ? 'amber' : 'slate'} hint={`${enAttente.length} loyer${enAttente.length > 1 ? 's' : ''}`} />
        <StatCard label="Reversé ce mois-ci" value={formatMontant(totalReverseCeMois)} tone="green" hint={`${reverseCeMois.length} virement${reverseCeMois.length > 1 ? 's' : ''}`} />
        <StatCard label="Frais de gestion (mois)" value={formatMontant(fraisGestionMois)} tone="blue" hint="Revenu de l'agence" />
      </div>

      {toutesLesLignes.length === 0 ? (
        <EmptyState title="Aucun loyer encaissé pour le moment" subtitle="Les reversements apparaîtront ici dès qu'un loyer sera marqué payé." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Rechercher un locataire..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="max-w-sm"
            />
            {state.immeubles.length > 0 && (
              <Select value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)} className="max-w-xs">
                <option value="">Tous les immeubles</option>
                {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
              </Select>
            )}
            <Select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="max-w-xs">
              {FILTRES_STATUT.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
            {immeubleSelectionne && (
              <Button variant="secondary" className="ml-auto" onClick={genererReleve}>
                Générer le relevé — {immeubleSelectionne.nom}
              </Button>
            )}
          </div>

          {lignes.length === 0 ? (
            <EmptyState title="Aucun résultat" subtitle="Aucun reversement ne correspond à ce filtre." />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2 pr-4">Locataire</th>
                      <th className="pb-2 pr-4">Immeuble / Propriétaire</th>
                      <th className="pb-2 pr-4">Mois</th>
                      <th className="pb-2 pr-4">Reçu le</th>
                      <th className="pb-2 pr-4">Loyer perçu</th>
                      <th className="pb-2 pr-4">Frais gestion</th>
                      <th className="pb-2 pr-4">Net à reverser</th>
                      <th className="pb-2 pr-4">Statut</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l) => {
                      const revInfo = STATUTS_REVERSEMENT[l.statutRev]
                      return (
                        <tr key={l.paiement.id} className="border-t border-slate-100">
                          <td className="py-2 pr-4 font-medium text-slate-800">{l.loc ? `${l.loc.prenom} ${l.loc.nom}` : '—'}</td>
                          <td className="py-2 pr-4 text-slate-600">
                            {l.immeuble ? l.immeuble.nom : '—'}
                            {l.immeuble?.proprietaireNom && <span className="block text-xs text-slate-400">{l.immeuble.proprietaireNom}</span>}
                          </td>
                          <td className="py-2 pr-4 text-slate-600">{labelMois(l.paiement.mois)}</td>
                          <td className="py-2 pr-4 text-slate-600">{formatDate(l.paiement.datePaiement)}</td>
                          <td className="py-2 pr-4 text-slate-600">{formatMontant(l.paiement.montantPaye)}</td>
                          <td className="py-2 pr-4 text-slate-600">{formatMontant(l.paiement.fraisGestion)}</td>
                          <td className="py-2 pr-4 font-medium text-slate-800">{formatMontant(l.net)}</td>
                          <td className="py-2 pr-4">
                            <Badge tone={revInfo.tone}>{l.statutRev === 'reverse' ? `Reversé le ${formatDate(l.paiement.dateReversement)}` : revInfo.label}</Badge>
                          </td>
                          <td className="py-2 text-right">
                            {l.statutRev === 'a_reverser' && (
                              <Button variant="secondary" onClick={() => ouvrirMarquerReverse(l)}>Marquer reversé</Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title="Confirmer le reversement au propriétaire"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-reversement">Confirmer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-reversement" onSubmit={confirmerReversement} className="space-y-4">
            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <p>{modal.ligne.loc ? `${modal.ligne.loc.prenom} ${modal.ligne.loc.nom}` : 'Locataire'} — {labelMois(modal.ligne.paiement.mois)}</p>
              <p className="mt-1">Loyer perçu : <strong>{formatMontant(modal.ligne.paiement.montantPaye)}</strong> — Frais de gestion : <strong>{formatMontant(modal.ligne.paiement.fraisGestion)}</strong></p>
              <p className="mt-1 font-medium text-slate-800">Net à reverser : {formatMontant(modal.ligne.net)}</p>
            </div>
            <Field label="Date d'envoi au propriétaire">
              <Input type="date" required value={modal.dateReversement} onChange={(e) => setModal((m) => ({ ...m, dateReversement: e.target.value }))} />
            </Field>
            {modal.ligne.immeuble?.proprietaireNom ? (
              <p className="text-xs text-slate-400">Une trace de ce virement sera enregistrée dans la messagerie de {modal.ligne.immeuble.proprietaireNom}.</p>
            ) : (
              <p className="text-xs text-warning-700">Aucun contact propriétaire renseigné pour cet immeuble : aucune trace ne sera enregistrée en messagerie.</p>
            )}
          </form>
        )}
      </Modal>
    </div>
  )
}
