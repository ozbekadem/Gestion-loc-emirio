import React from 'react'
import { Card, Badge, Button } from '../../components/ui.jsx'
import { formatMontant, labelMois, moisCourant, statutPaiementInfo } from '../../lib/utils.js'

export default function CarteHistoriquePaiements({ statutMoisCourant, paiementsRecents, meriteRelance, onRelancer }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Historique des paiements</h2>
        {statutMoisCourant && <Badge tone={statutMoisCourant.tone}>Ce mois : {statutMoisCourant.label}</Badge>}
      </div>
      {paiementsRecents.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
      ) : (
        <div className="space-y-1.5">
          {paiementsRecents.map((p) => {
            const info = statutPaiementInfo(p.statut)
            return (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{labelMois(p.mois)}</span>
                <Badge tone={info.tone}>{info.label}{p.montantPaye ? ` — ${formatMontant(p.montantPaye)}` : ''}</Badge>
              </div>
            )
          })}
        </div>
      )}
      {meriteRelance && (
        <Button variant="danger" className="mt-3 w-full" onClick={onRelancer}>Envoyer une relance pour {labelMois(moisCourant())}</Button>
      )}
    </Card>
  )
}
