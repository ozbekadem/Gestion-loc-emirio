import React from 'react'
import { Card } from '../../components/ui.jsx'
import { formatDate, formatMontant } from '../../lib/utils.js'

export default function CarteBailActif({ bail }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Bail actif</h2>
      {bail ? (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Période</dt><dd className="text-slate-800">{formatDate(bail.dateDebut)} → {formatDate(bail.dateFin)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Loyer + charges</dt><dd className="font-medium text-slate-900">{formatMontant(Number(bail.loyer) + Number(bail.charges))}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Dépôt garantie</dt><dd className="text-slate-800">{formatMontant(bail.depotGarantie)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Fréquence</dt><dd className="text-slate-800 capitalize">{bail.frequence || 'mensuel'}</dd></div>
        </dl>
      ) : (
        <p className="text-sm text-slate-500">Aucun bail actif pour ce locataire.</p>
      )}
    </Card>
  )
}
