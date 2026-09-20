import React from 'react'
import { Card, Button, Select } from '../../components/ui.jsx'
import { TYPES_DOCUMENT } from './constants.js'

export default function CarteDocuments({ docs, typeUpload, setTypeUpload, fileInput, onImporter, onSupprimer, onApercu }) {
  return (
    <Card className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Documents</h2>
        <div className="flex items-center gap-2">
          <Select value={typeUpload} onChange={(e) => setTypeUpload(e.target.value)} className="max-w-[10rem] text-xs">
            {TYPES_DOCUMENT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>+ Ajouter</Button>
          <input ref={fileInput} type="file" accept="image/*,application/pdf" className="hidden" onChange={onImporter} />
        </div>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun document : pièce d'identité, contrat de bail signé, attestation d'assurance...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {docs.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-slate-200 p-2">
              <button onClick={() => onApercu(doc)} className="block w-full">
                {doc.mime?.startsWith('image/') ? (
                  <img src={doc.dataUrl} alt={doc.nom} className="h-24 w-full rounded object-cover" />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center rounded bg-slate-100 text-3xl">🧾</div>
                )}
              </button>
              <p className="mt-1 truncate text-xs font-medium text-slate-700" title={doc.nom}>{doc.nom}</p>
              <p className="text-[11px] text-slate-400">{TYPES_DOCUMENT.find((t) => t.value === doc.type)?.label}</p>
              <Button variant="danger" className="mt-1 w-full !py-1 text-xs" onClick={() => onSupprimer(doc)}>Supprimer</Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
