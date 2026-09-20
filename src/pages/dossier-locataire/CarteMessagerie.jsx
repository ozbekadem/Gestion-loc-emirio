import React from 'react'
import { Card, Badge } from '../../components/ui.jsx'
import { formatDate } from '../../lib/utils.js'

export default function CarteMessagerie({ messages }) {
  return (
    <Card className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Messagerie récente</h2>
      {messages.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun message échangé avec ce locataire.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {messages.slice(0, 3).map((m) => (
            <div key={m.id} className="py-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-800">{m.sujet}</p>
                <Badge tone={m.sens === 'envoye' ? 'blue' : 'slate'}>{m.sens === 'envoye' ? 'Envoyé' : 'Reçu'}</Badge>
              </div>
              <p className="text-xs text-slate-400">{formatDate(m.date)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
