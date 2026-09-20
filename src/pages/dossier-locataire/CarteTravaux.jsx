import React from 'react'
import { Card, Badge } from '../../components/ui.jsx'

export default function CarteTravaux({ travaux, prestataires, onApercuPhoto }) {
  return (
    <Card className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Travaux / Interventions</h2>
      {travaux.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune intervention enregistrée pour ce logement.</p>
      ) : (
        <div className="space-y-3">
          {travaux.map((t) => {
            const prestataire = prestataires.find((p) => p.id === t.prestataireId)
            return (
              <div key={t.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-800">{t.titre}</p>
                  <Badge tone={t.statut === 'termine' ? 'green' : t.statut === 'en_cours' ? 'amber' : 'slate'}>
                    {t.statut === 'termine' ? 'Terminé' : t.statut === 'en_cours' ? 'En cours' : 'À planifier'}
                  </Badge>
                </div>
                {prestataire && <p className="text-xs text-slate-400">Prestataire : {prestataire.nom}</p>}
                {t.description && <p className="mt-1 text-sm text-slate-500">{t.description}</p>}
                {t.photos?.length > 0 && (
                  <div className="mt-2 flex gap-1.5 overflow-x-auto">
                    {t.photos.map((p) => (
                      <button key={p.id} type="button" onClick={() => onApercuPhoto(t, p)} className="shrink-0">
                        <img src={p.dataUrl} alt="" className="h-14 w-14 rounded object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {t.rapportPrestataire && <p className="mt-2 text-sm text-slate-600">📝 {t.rapportPrestataire}</p>}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
