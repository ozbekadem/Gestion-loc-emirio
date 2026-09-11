import React, { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { useNavigate } from '../lib/nav.jsx'
import { Card, PageHeader, StatCard, Button, Badge, EmptyState } from '../components/ui.jsx'
import { LineChart, DonutChart, chartColor } from '../components/charts.jsx'
import { formatMontant, formatDate, moisCourant, MOIS_FR } from '../lib/utils.js'
import { getTaches } from '../lib/taches.js'

const URGENCE_TONE = { haute: 'red', moyenne: 'amber', basse: 'slate' }
const STATUT_TRAVAUX_LABEL = { a_planifier: 'à planifier', en_cours: 'en cours', termine: 'terminé' }

function moisDecale(moisKey, delta) {
  const [annee, mois] = moisKey.split('-').map(Number)
  const d = new Date(annee, mois - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function immeubleDuBail(state, bailId) {
  const bail = state.baux.find((b) => b.id === bailId)
  const bien = bail ? state.biens.find((b) => b.id === bail.bienId) : null
  return bien?.immeubleId || null
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function Dashboard() {
  const { state } = useStore()
  const goto = useNavigate()
  const { immeubles, biens, locataires, baux, paiements, travaux, candidatures, sinistres, messages } = state
  const mois = moisCourant()
  // Le mois en cours est encore incomplet (paiements pas tous saisis) : les KPI
  // "avec tendance" se basent sur le dernier mois clos pour rester comparables.
  const moisReference = moisDecale(mois, -1)
  const moisReferencePrecedent = moisDecale(moisReference, -1)

  const encaisseDuMois = (m) =>
    paiements.filter((p) => p.mois === m && (p.statut === 'paye' || p.statut === 'partiel')).reduce((s, p) => s + Number(p.montantPaye || 0), 0)

  const kpis = useMemo(() => {
    const bauxActifs = baux.filter((b) => b.statut === 'actif')
    const attendu = bauxActifs.reduce((sum, b) => sum + Number(b.loyer || 0) + Number(b.charges || 0), 0)
    const encaisseReference = encaisseDuMois(moisReference)
    const encaisseReferencePrecedent = encaisseDuMois(moisReferencePrecedent)
    const travauxEnCours = travaux.filter((t) => t.statut !== 'termine').length
    const candidaturesEnAttente = candidatures.filter((c) => c.statut !== 'refusee' && c.statut !== 'acceptee').length
    const biensOccupes = biens.filter((b) => locataires.some((l) => l.bienId === b.id)).length
    const tauxOccupation = biens.length ? Math.round((biensOccupes / biens.length) * 100) : 0
    const tauxRecouvrement = attendu ? Math.round((encaisseReference / attendu) * 100) : 0
    const tauxRecouvrementPrecedent = attendu ? Math.round((encaisseReferencePrecedent / attendu) * 100) : 0
    const trendEncaisse = encaisseReferencePrecedent > 0 ? Math.round(((encaisseReference - encaisseReferencePrecedent) / encaisseReferencePrecedent) * 100) : null
    return {
      encaisseReference, travauxEnCours, candidaturesEnAttente,
      bauxActifs: bauxActifs.length, tauxOccupation, tauxRecouvrement,
      trendEncaisse, trendRecouvrement: tauxRecouvrement - tauxRecouvrementPrecedent,
    }
  }, [baux, paiements, biens, locataires, travaux, candidatures, moisReference, moisReferencePrecedent])

  const revenusParMois = useMemo(() => {
    const mois6 = Array.from({ length: 6 }, (_, i) => moisDecale(mois, i - 5))
    return mois6.map((m) => ({ label: MOIS_FR[Number(m.split('-')[1]) - 1].slice(0, 3), value: encaisseDuMois(m) }))
  }, [paiements, mois])
  const totalRevenus6Mois = revenusParMois.reduce((s, r) => s + r.value, 0)

  const depenses = useMemo(() => {
    const depuis = new Date()
    depuis.setMonth(depuis.getMonth() - 12)
    const parCategorie = new Map()
    travaux.filter((t) => t.date && new Date(t.date) >= depuis).forEach((t) => {
      const cle = t.categorie || 'Autre'
      parCategorie.set(cle, (parCategorie.get(cle) || 0) + (Number(t.cout) || 0))
    })
    sinistres.filter((s) => s.dateSinistre && new Date(s.dateSinistre) >= depuis).forEach((s) => {
      const cle = s.type || 'Sinistre'
      parCategorie.set(cle, (parCategorie.get(cle) || 0) + (Number(s.montantEstime) || 0))
    })
    return [...parCategorie.entries()]
      .map(([label, value], i) => ({ label, value, color: chartColor(i) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [travaux, sinistres])
  const totalDepenses = depenses.reduce((s, d) => s + d.value, 0)

  const parImmeuble = useMemo(() => {
    return immeubles.map((im) => {
      const bauxImmeuble = baux.filter((b) => b.statut === 'actif' && biens.find((bi) => bi.id === b.bienId)?.immeubleId === im.id)
      const attendu = bauxImmeuble.reduce((s, b) => s + Number(b.loyer || 0) + Number(b.charges || 0), 0)
      const encaisse = paiements
        .filter((p) => p.mois === mois && (p.statut === 'paye' || p.statut === 'partiel') && immeubleDuBail(state, p.bailId) === im.id)
        .reduce((s, p) => s + Number(p.montantPaye || 0), 0)
      return { immeuble: im, attendu, encaisse }
    }).filter((r) => r.attendu > 0)
  }, [immeubles, baux, biens, paiements, mois, state])

  const activiteRecente = useMemo(() => {
    const items = []
    paiements.filter((p) => p.datePaiement && (p.statut === 'paye' || p.statut === 'partiel')).forEach((p) => {
      const bail = baux.find((b) => b.id === p.bailId)
      const loc = bail ? locataires.find((l) => l.id === bail.locataireId) : null
      items.push({
        date: p.datePaiement,
        icon: '💶',
        text: `Loyer ${p.statut === 'partiel' ? 'partiellement encaissé' : 'encaissé'} — ${loc ? `${loc.prenom} ${loc.nom}` : 'locataire'} — ${formatMontant(p.montantPaye)}`,
      })
    })
    travaux.filter((t) => t.date).forEach((t) => {
      items.push({ date: t.date, icon: '🛠️', text: `Travaux ${STATUT_TRAVAUX_LABEL[t.statut] || ''} — ${t.titre}` })
    })
    messages.forEach((m) => {
      items.push({ date: m.date, icon: '✉️', text: `Message envoyé — ${m.sujet}` })
    })
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)
  }, [paiements, baux, locataires, travaux, messages])

  const prochainesEcheances = useMemo(
    () =>
      [...baux]
        .filter((b) => b.statut === 'actif')
        .sort((a, b) => new Date(a.dateFin) - new Date(b.dateFin))
        .slice(0, 5),
    [baux],
  )

  const taches = useMemo(() => getTaches(state), [state])
  const tachesPrioritaires = taches.slice(0, 5)

  return (
    <div>
      <PageHeader
        title={`${greeting()} 👋`}
        subtitle="Voici la situation de votre patrimoine locatif aujourd'hui"
        icon="🏠"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={`Loyers encaissés — ${MOIS_FR[Number(moisReference.split('-')[1]) - 1]}`}
          value={formatMontant(kpis.encaisseReference)}
          tone="green"
          icon="✅"
          trend={kpis.trendEncaisse === null ? undefined : { value: kpis.trendEncaisse, suffix: '%', label: 'vs le mois précédent' }}
        />
        <StatCard
          label={`Taux de recouvrement — ${MOIS_FR[Number(moisReference.split('-')[1]) - 1]}`}
          value={`${kpis.tauxRecouvrement}%`}
          tone={kpis.tauxRecouvrement >= 90 ? 'green' : 'amber'}
          icon="🎯"
          trend={{ value: kpis.trendRecouvrement, suffix: 'pt', label: 'vs le mois précédent' }}
        />
        <StatCard
          label="Taux d'occupation"
          value={`${kpis.tauxOccupation}%`}
          tone="blue"
          icon="📊"
          hint="Biens occupés sur le total"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Immeubles" value={immeubles.length} icon="🏢" />
        <StatCard label="Locataires actifs" value={locataires.length} icon="👤" />
        <StatCard label="Baux actifs" value={kpis.bauxActifs} icon="📄" />
        <StatCard label="Travaux en cours" value={kpis.travauxEnCours} tone="amber" icon="🛠️" />
        <StatCard label="Candidatures en attente" value={kpis.candidaturesEnAttente} tone="blue" icon="📥" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Loyers encaissés</h2>
            <span className="text-sm text-slate-400">6 derniers mois</span>
          </div>
          <p className="mb-4 text-2xl font-bold tracking-tight text-slate-900">{formatMontant(totalRevenus6Mois)}</p>
          <LineChart data={revenusParMois} />
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900">Répartition des dépenses</h2>
          {depenses.length === 0 ? (
            <EmptyState title="Aucune dépense récente" subtitle="Les travaux et sinistres des 12 derniers mois apparaîtront ici." />
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart data={depenses} centerValue={formatMontant(totalDepenses)} centerLabel="12 mois" />
              <div className="flex-1 space-y-2">
                {depenses.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.label}
                    </span>
                    <span className="font-medium text-slate-800">{formatMontant(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {parImmeuble.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Encaissement par immeuble — {MOIS_FR[Number(mois.split('-')[1]) - 1]}</h2>
          <div className="space-y-4">
            {parImmeuble.map(({ immeuble, attendu, encaisse }) => {
              const pct = attendu ? Math.min(100, Math.round((encaisse / attendu) * 100)) : 0
              return (
                <div key={immeuble.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{immeuble.nom}</span>
                    <span className="text-slate-500">{formatMontant(encaisse)} / {formatMontant(attendu)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Tâches prioritaires</h2>
            <Button variant="ghost" onClick={() => goto('taches')}>Voir tout ({taches.length})</Button>
          </div>
          {tachesPrioritaires.length === 0 ? (
            <EmptyState title="Tous les dossiers sont à jour" subtitle="Aucune tâche en attente pour le moment." />
          ) : (
            <div className="divide-y divide-slate-100">
              {tachesPrioritaires.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.titre}</p>
                    <p className="text-xs text-slate-500">{t.detail}{t.lieu ? ` — ${t.lieu}` : ''}</p>
                  </div>
                  <Badge tone={URGENCE_TONE[t.urgence]}>{t.urgence === 'haute' ? 'Urgent' : t.urgence === 'moyenne' ? 'À traiter' : 'Plus tard'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900">Activité récente</h2>
          {activiteRecente.length === 0 ? (
            <EmptyState title="Aucune activité récente" subtitle="Les derniers paiements, travaux et messages apparaîtront ici." />
          ) : (
            <div className="divide-y divide-slate-100">
              {activiteRecente.map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 text-base" aria-hidden>{a.icon}</span>
                  <div>
                    <p className="text-sm text-slate-700">{a.text}</p>
                    <p className="text-xs text-slate-400">{formatDate(a.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Échéances de bail à venir</h2>
          {prochainesEcheances.length === 0 ? (
            <EmptyState title="Aucun bail actif" subtitle="Ajoutez un locataire et un bail pour commencer le suivi." />
          ) : (
            <div className="divide-y divide-slate-100">
              {prochainesEcheances.map((b) => {
                const loc = locataires.find((l) => l.id === b.locataireId)
                return (
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {loc ? `${loc.prenom} ${loc.nom}` : 'Locataire inconnu'}
                      </p>
                      <p className="text-sm text-slate-500">Fin de bail : {formatDate(b.dateFin)}</p>
                    </div>
                    <Badge tone="blue">{formatMontant(Number(b.loyer) + Number(b.charges))}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900">Actions rapides</h2>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => goto('immeubles')}>+ Ajouter un immeuble</Button>
            <Button variant="secondary" onClick={() => goto('locataires')}>+ Ajouter un locataire</Button>
            <Button variant="secondary" onClick={() => goto('baux')}>+ Créer un bail</Button>
            <Button variant="secondary" onClick={() => goto('travaux')}>+ Signaler un travail</Button>
            <Button variant="secondary" onClick={() => goto('paiements')}>Voir les paiements</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
