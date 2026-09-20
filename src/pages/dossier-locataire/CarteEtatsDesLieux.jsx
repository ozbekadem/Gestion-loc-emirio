import React from 'react'
import { Card, Button } from '../../components/ui.jsx'
import { formatDate } from '../../lib/utils.js'

export default function CarteEtatsDesLieux({ bail, etatsDesLieux, onNouveau, onConsulter, onSupprimer }) {
  return (
    <Card className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">États des lieux</h2>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!bail} onClick={() => onNouveau('entree')}>+ État d'entrée</Button>
          <Button variant="secondary" disabled={!bail} onClick={() => onNouveau('sortie')}>+ État de sortie</Button>
        </div>
      </div>
      {!bail ? (
        <p className="text-sm text-slate-500">Un bail actif est nécessaire pour créer un état des lieux.</p>
      ) : etatsDesLieux.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun état des lieux enregistré pour ce bail.</p>
      ) : (
        <div className="space-y-2">
          {etatsDesLieux.map((edl) => (
            <div key={edl.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <span className="font-medium text-slate-800">{edl.type === 'entree' ? "État des lieux d'entrée" : 'État des lieux de sortie'}</span>
                <span className="ml-2 text-sm text-slate-500">{formatDate(edl.date)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onConsulter(edl)}>Consulter</Button>
                <Button variant="danger" onClick={() => onSupprimer(edl)}>Suppr.</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
