import React from 'react'
import { Card, Badge, Button } from '../../components/ui.jsx'
import { formatDate } from '../../lib/utils.js'

export default function CarteSuiviAdministratif({ bail, itemsAdmin, onMarquerFait }) {
  if (!bail) return null
  return (
    <Card className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Suivi administratif du dossier</h2>
      <div className="divide-y divide-slate-100">
        {itemsAdmin.map((item) => (
          <div key={item.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${item.ok ? 'bg-success-500' : 'bg-danger-500'}`} aria-hidden />
              <span className="text-sm text-slate-700">{item.label}</span>
              <span className="text-xs text-slate-400">
                {item.valeur ? `Dernière fois : ${formatDate(item.valeur)}` : 'Jamais renseigné'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.ok ? <Badge tone="green">À jour</Badge> : <Badge tone="red">À faire</Badge>}
              <Button variant="ghost" onClick={() => onMarquerFait(item.key)}>Marquer fait</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
