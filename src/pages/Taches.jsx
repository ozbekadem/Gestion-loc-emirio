import React, { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { useNavigate } from '../lib/nav.jsx'
import { Card, PageHeader, Button, Badge, EmptyState } from '../components/ui.jsx'
import { getTaches } from '../lib/taches.js'

const URGENCE_INFO = {
  haute: { label: 'Urgent', tone: 'red' },
  moyenne: { label: 'À traiter', tone: 'amber' },
  basse: { label: 'Quand possible', tone: 'slate' },
}

const TYPE_ICONE = {
  dossier_administratif: '📋',
  echeance_bail: '📄',
  etat_des_lieux: '🔑',
  identite_manquante: '🪪',
  proprietaire_manquant: '🏠',
  sinistre_suivi: '🛡️',
  travaux_urgent: '🛠️',
}

export default function Taches() {
  const { state } = useStore()
  const goto = useNavigate()

  const taches = useMemo(() => getTaches(state), [state])
  const parUrgence = {
    haute: taches.filter((t) => t.urgence === 'haute'),
    moyenne: taches.filter((t) => t.urgence === 'moyenne'),
    basse: taches.filter((t) => t.urgence === 'basse'),
  }

  return (
    <div>
      <PageHeader
        title="Tâches"
        subtitle="Actions automatiques pour compléter les dossiers locataires, propriétaires et immeubles"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Urgent</p>
          <p className="mt-1 text-2xl font-bold text-danger-600">{parUrgence.haute.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">À traiter</p>
          <p className="mt-1 text-2xl font-bold text-warning-600">{parUrgence.moyenne.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Quand possible</p>
          <p className="mt-1 text-2xl font-bold text-slate-500">{parUrgence.basse.length}</p>
        </Card>
      </div>

      {taches.length === 0 ? (
        <EmptyState title="Tous les dossiers sont à jour" subtitle="Aucune tâche en attente pour le moment." />
      ) : (
        <Card>
          <div className="divide-y divide-slate-100">
            {taches.map((t) => {
              const info = URGENCE_INFO[t.urgence]
              return (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg" aria-hidden>{TYPE_ICONE[t.type] || '📌'}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-800">{t.titre}</p>
                        <Badge tone={info.tone}>{info.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{t.detail}{t.lieu ? ` — ${t.lieu}` : ''}</p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => goto(t.page)}>Ouvrir</Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
