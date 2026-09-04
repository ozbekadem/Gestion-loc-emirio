import React, { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { useNavigate } from '../lib/nav.jsx'
import { Card, PageHeader, StatCard, Button, Badge, EmptyState } from '../components/ui.jsx'
import { formatMontant, formatDate, moisCourant } from '../lib/utils.js'

export default function Dashboard() {
  const { state } = useStore()
  const goto = useNavigate()
  const { immeubles, biens, locataires, baux, paiements, travaux, candidatures } = state
  const mois = moisCourant()

  const kpis = useMemo(() => {
    const bauxActifs = baux.filter((b) => b.statut === 'actif')
    const attendu = bauxActifs.reduce((sum, b) => sum + Number(b.loyer || 0) + Number(b.charges || 0), 0)
    const paiementsMois = paiements.filter((p) => p.mois === mois)
    const encaisse = paiementsMois
      .filter((p) => p.statut === 'paye' || p.statut === 'partiel')
      .reduce((sum, p) => sum + Number(p.montantPaye || 0), 0)
    const locatairesRetard = paiementsMois.filter((p) => p.statut === 'retard').length
    const travauxEnCours = travaux.filter((t) => t.statut !== 'termine').length
    const candidaturesEnAttente = candidatures.filter((c) => c.statut !== 'refusee' && c.statut !== 'acceptee').length
    const biensOccupes = biens.filter((b) => locataires.some((l) => l.bienId === b.id)).length
    const tauxOccupation = biens.length ? Math.round((biensOccupes / biens.length) * 100) : 0
    const tauxRecouvrement = attendu ? Math.round((encaisse / attendu) * 100) : 0
    return { attendu, encaisse, locatairesRetard, travauxEnCours, candidaturesEnAttente, bauxActifs: bauxActifs.length, tauxOccupation, tauxRecouvrement }
  }, [baux, paiements, biens, locataires, travaux, candidatures, mois])

  const prochainesEcheances = useMemo(
    () =>
      [...baux]
        .filter((b) => b.statut === 'actif')
        .sort((a, b) => new Date(a.dateFin) - new Date(b.dateFin))
        .slice(0, 5),
    [baux],
  )

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de votre patrimoine locatif"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Immeubles" value={immeubles.length} />
        <StatCard label="Locataires actifs" value={locataires.length} />
        <StatCard label="Loyers attendus (mois)" value={formatMontant(kpis.attendu)} tone="blue" />
        <StatCard label="Loyers encaissés (mois)" value={formatMontant(kpis.encaisse)} tone="green" />
        <StatCard label="Locataires en retard" value={kpis.locatairesRetard} tone={kpis.locatairesRetard > 0 ? 'red' : 'slate'} />
        <StatCard label="Travaux en cours" value={kpis.travauxEnCours} tone="amber" />
        <StatCard label="Candidatures en attente" value={kpis.candidaturesEnAttente} tone="blue" />
        <StatCard label="Baux actifs" value={kpis.bauxActifs} />
        <StatCard label="Taux d'occupation" value={`${kpis.tauxOccupation}%`} tone="blue" />
        <StatCard label="Taux de recouvrement (mois)" value={`${kpis.tauxRecouvrement}%`} tone={kpis.tauxRecouvrement >= 90 ? 'green' : 'amber'} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
