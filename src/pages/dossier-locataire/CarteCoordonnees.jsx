import React from 'react'
import { Card, Textarea } from '../../components/ui.jsx'
import { formatDate } from '../../lib/utils.js'

export default function CarteCoordonnees({ locataire, onNotesChange }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Coordonnées</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-slate-500">E-mail</dt><dd className="text-slate-800">{locataire.email || '—'}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Téléphone</dt><dd className="text-slate-800">{locataire.telephone || '—'}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Entrée</dt><dd className="text-slate-800">{formatDate(locataire.dateEntree)}</dd></div>
      </dl>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="mb-1.5 text-xs font-medium text-slate-500">Notes internes</p>
        <Textarea
          placeholder="Ex. : accord de paiement en 2 fois, difficulté financière temporaire..."
          defaultValue={locataire.notes || ''}
          onBlur={(e) => onNotesChange(e.target.value)}
          rows={3}
        />
      </div>
    </Card>
  )
}
