import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, Button, Badge, Select, Modal } from './ui.jsx'
import {
  formatMontant, labelMois, moisCourant, moisDecale,
  statutPaiementInfo, statutLocataireInfo, agregerPaiementsPeriode, dernierMoisProbleme, texteRappelLoyer,
} from '../lib/utils.js'

const FENETRE_MOIS = 6
const MOIS_ABREGES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const AVATAR_TONES = ['bg-brand-600', 'bg-teal-600', 'bg-accent-600', 'bg-rose-600']
const RING_R = 24
const RING_C = 2 * Math.PI * RING_R

function moisAbrege(moisKey) {
  return MOIS_ABREGES[Number(moisKey.split('-')[1]) - 1]
}

// Comme le Dashboard ("le mois en cours est encore incomplet"), on ne juge
// jamais le mois en cours : il n'est pas encore échu, donc jamais "en retard"
// le premier jour du mois. La fenêtre regardée est donc les FENETRE_MOIS
// derniers mois déjà clos.
function moisClosRecents(nb) {
  return Array.from({ length: nb }, (_, i) => moisDecale(moisCourant(), i - nb))
}

function initiales(loc) {
  if (!loc) return '?'
  return `${loc.prenom?.[0] || ''}${loc.nom?.[0] || ''}`.toUpperCase() || '?'
}

function Anneau({ pct, tone }) {
  const offset = pct === null ? RING_C : RING_C * (1 - pct / 100)
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={RING_R} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100" />
        <circle
          cx="28" cy="28" r={RING_R} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={RING_C} strokeDashoffset={offset} className={tone}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">
        {pct === null ? '—' : `${pct}%`}
      </span>
    </div>
  )
}

export default function VuePortefeuille() {
  const { state, messages } = useStore()
  const [filtreImmeuble, setFiltreImmeuble] = useState('')
  const [rappel, setRappel] = useState(null)

  const moisEcoules = useMemo(() => moisClosRecents(FENETRE_MOIS), [])

  const lignes = useMemo(() => {
    return state.baux
      .filter((b) => b.statut === 'actif')
      .map((b) => {
        const loc = state.locataires.find((l) => l.id === b.locataireId)
        const bien = state.biens.find((x) => x.id === b.bienId)
        const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
        const montantAttendu = Number(b.loyer) + Number(b.charges)
        const paiementsParMois = {}
        state.paiements.filter((p) => p.bailId === b.id).forEach((p) => { paiementsParMois[p.mois] = p })
        const agregat = agregerPaiementsPeriode(montantAttendu, paiementsParMois, moisEcoules)
        const moisProbleme = dernierMoisProbleme(paiementsParMois, moisEcoules)
        return { bail: b, loc, bien, immeuble, montantAttendu, paiementsParMois, ...agregat, moisProbleme }
      })
      .filter((l) => !filtreImmeuble || l.immeuble?.id === filtreImmeuble)
  }, [state.baux, state.locataires, state.biens, state.immeubles, state.paiements, moisEcoules, filtreImmeuble])

  function relancer(ligne) {
    if (!ligne.loc || !ligne.moisProbleme) return
    const paiementProbleme = ligne.paiementsParMois[ligne.moisProbleme]
    const montantDu = ligne.montantAttendu - Number(paiementProbleme?.montantPaye || 0)
    const texte = texteRappelLoyer(ligne.loc, montantDu, labelMois(ligne.moisProbleme))
    messages.add({
      locataireId: ligne.loc.id,
      destinataire: 'locataire',
      canal: 'email',
      sujet: `Rappel de loyer — ${labelMois(ligne.moisProbleme)}`,
      contenu: texte,
      date: new Date().toISOString().slice(0, 10),
      sens: 'envoye',
    })
    setRappel({ loc: ligne.loc, texte })
  }

  const totalAttenduParc = lignes.reduce((s, l) => s + l.totalAttendu, 0)
  const totalEncaisseParc = lignes.reduce((s, l) => s + l.totalEncaisse, 0)
  const tauxParc = totalAttenduParc ? Math.round((totalEncaisseParc / totalAttenduParc) * 100) : null
  const nbEnRetard = lignes.filter((l) => l.moisProbleme).length

  const periodeLabel = moisEcoules.length > 0 ? `${labelMois(moisEcoules[0])} → ${labelMois(moisEcoules[moisEcoules.length - 1])}` : ''

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-500">Les {FENETRE_MOIS} derniers mois clos : <span className="font-medium text-slate-700">{periodeLabel}</span></p>
        {state.immeubles.length > 0 && (
          <Select value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)} className="ml-auto max-w-xs">
            <option value="">Tous les immeubles</option>
            {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
          </Select>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-slate-500">Encaissé sur la période</p><p className="mt-1 text-xl font-bold text-slate-900">{formatMontant(totalEncaisseParc)}</p></Card>
        <Card><p className="text-sm text-slate-500">Taux de recouvrement du parc</p><p className={`mt-1 text-xl font-bold ${tauxParc !== null && tauxParc < 100 ? 'text-accent-600' : 'text-slate-900'}`}>{tauxParc === null ? '—' : `${tauxParc}%`}</p></Card>
        <Card><p className="text-sm text-slate-500">Locataires à relancer</p><p className={`mt-1 text-xl font-bold ${nbEnRetard > 0 ? 'text-danger-600' : 'text-slate-900'}`}>{nbEnRetard}</p></Card>
      </div>

      {lignes.length === 0 ? (
        <Card><p className="py-8 text-center text-slate-400">Aucun bail actif pour ce filtre.</p></Card>
      ) : (
        <Card className="divide-y divide-slate-100 !p-0">
          {lignes.map((l, idx) => {
            const notation = statutLocataireInfo(l.loc?.statut)
            const ringTone = l.pct === 100 ? 'text-accent-600' : l.hasRetard ? 'text-danger-500' : l.hasManque ? 'text-warning-500' : 'text-success-500'
            return (
              <div key={l.bail.id} className="flex flex-wrap items-center gap-4 px-4 py-4 hover:bg-slate-50">
                <div className="flex min-w-[190px] flex-1 items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR_TONES[idx % AVATAR_TONES.length]}`}>
                    {initiales(l.loc)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{l.loc ? `${l.loc.prenom} ${l.loc.nom}` : '—'}</p>
                    <p className="text-xs text-slate-400">{l.bien ? l.bien.nom : '—'}</p>
                  </div>
                </div>

                <div className="group relative flex min-w-[180px] flex-[2] gap-[3px]">
                  {moisEcoules.map((mois) => {
                    const p = l.paiementsParMois[mois]
                    const info = statutPaiementInfo(p?.statut || 'attendu')
                    return <div key={mois} className={`h-6 flex-1 rounded ${info.cellClass.split(' ')[0]}`} title={labelMois(mois)} />
                  })}
                  {moisEcoules.length > 0 && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 flex -translate-x-1/2 translate-y-1 flex-col gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white p-2.5 opacity-0 shadow-soft-lg transition group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Historique {FENETRE_MOIS} mois</p>
                      <div className="flex items-end gap-1.5">
                        {moisEcoules.map((mois) => {
                          const p = l.paiementsParMois[mois]
                          const statut = p?.statut || 'attendu'
                          const montant = statut === 'paye' || statut === 'partiel' ? Number(p.montantPaye) || 0 : 0
                          const hPx = Math.max(4, Math.round((montant / l.montantAttendu) * 28))
                          const info = statutPaiementInfo(statut)
                          return (
                            <div key={mois} className="flex flex-col items-center gap-1">
                              <div className="flex h-7 w-2.5 items-end">
                                <div className={`w-full rounded-t ${info.cellClass.split(' ')[0]}`} style={{ height: `${hPx}px` }} />
                              </div>
                              <span className="text-[9px] text-slate-400">{moisAbrege(mois)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex min-w-[230px] flex-1 items-center justify-end gap-4">
                  <Badge tone={notation.tone}>{notation.label}</Badge>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-slate-800">{formatMontant(l.totalEncaisse)}</p>
                    <p className="text-xs text-slate-400">sur {formatMontant(l.totalAttendu)}</p>
                  </div>
                  <Anneau pct={l.pct} tone={ringTone} />
                  {l.moisProbleme && (
                    <Button variant="danger" onClick={() => relancer(l)}>Relancer</Button>
                  )}
                </div>
              </div>
            )
          })}
        </Card>
      )}

      <Modal
        open={!!rappel}
        onClose={() => setRappel(null)}
        title={rappel ? `Rappel envoyé à ${rappel.loc.prenom} ${rappel.loc.nom}` : ''}
        footer={<Button onClick={() => setRappel(null)}>Fermer</Button>}
      >
        {rappel && (
          <>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{rappel.texte}</pre>
            <p className="mt-2 text-xs text-slate-400">Ce rappel a été enregistré dans la messagerie du locataire.</p>
          </>
        )}
      </Modal>
    </div>
  )
}
