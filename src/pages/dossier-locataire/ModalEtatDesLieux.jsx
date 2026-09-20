import React from 'react'
import { Modal, Button, Field, Input, Select, Textarea, Badge } from '../../components/ui.jsx'
import { formatDate } from '../../lib/utils.js'
import { ETATS_PIECE, toneEtat } from './constants.js'

export default function ModalEtatDesLieux({ modalEdl, setModalEdl, onSave }) {
  return (
    <Modal
      open={!!modalEdl}
      onClose={() => setModalEdl(null)}
      title={modalEdl?.values?.type === 'sortie' ? 'État des lieux de sortie' : "État des lieux d'entrée"}
      footer={
        modalEdl?.mode === 'create' ? (
          <>
            <Button variant="secondary" onClick={() => setModalEdl(null)}>Annuler</Button>
            <Button type="submit" form="form-edl">Enregistrer</Button>
          </>
        ) : (
          <Button onClick={() => setModalEdl(null)}>Fermer</Button>
        )
      }
    >
      {modalEdl && modalEdl.mode === 'create' && (
        <form id="form-edl" onSubmit={onSave} className="space-y-4">
          <Field label="Date">
            <Input type="date" value={modalEdl.values.date} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, date: e.target.value } }))} />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">État par pièce</p>
            <div className="space-y-2">
              {modalEdl.values.pieces.map((p, i) => (
                <div key={p.nom} className="grid grid-cols-3 gap-2">
                  <span className="self-center text-sm text-slate-600">{p.nom}</span>
                  <Select
                    value={p.etat}
                    onChange={(e) => setModalEdl((m) => {
                      const pieces = [...m.values.pieces]
                      pieces[i] = { ...pieces[i], etat: e.target.value }
                      return { ...m, values: { ...m.values, pieces } }
                    })}
                  >
                    {ETATS_PIECE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>
                  <Input
                    placeholder="Commentaire"
                    value={p.commentaire}
                    onChange={(e) => setModalEdl((m) => {
                      const pieces = [...m.values.pieces]
                      pieces[i] = { ...pieces[i], commentaire: e.target.value }
                      return { ...m, values: { ...m.values, pieces } }
                    })}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Élec. (index)">
              <Input value={modalEdl.values.compteurs.electricite} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, compteurs: { ...m.values.compteurs, electricite: e.target.value } } }))} />
            </Field>
            <Field label="Eau (index)">
              <Input value={modalEdl.values.compteurs.eau} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, compteurs: { ...m.values.compteurs, eau: e.target.value } } }))} />
            </Field>
            <Field label="Gaz (index)">
              <Input value={modalEdl.values.compteurs.gaz} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, compteurs: { ...m.values.compteurs, gaz: e.target.value } } }))} />
            </Field>
            <Field label="Nb de clés">
              <Input type="number" min="0" value={modalEdl.values.nombreCles} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, nombreCles: e.target.value } }))} />
            </Field>
          </div>
          <Field label="Observations générales">
            <Textarea value={modalEdl.values.observations} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, observations: e.target.value } }))} />
          </Field>
        </form>
      )}

      {modalEdl && modalEdl.mode === 'view' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Date : {formatDate(modalEdl.values.date)}</p>
          <div className="space-y-1.5">
            {modalEdl.values.pieces.map((p) => (
              <div key={p.nom} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{p.nom}{p.commentaire ? ` — ${p.commentaire}` : ''}</span>
                <Badge tone={toneEtat(p.etat)}>{ETATS_PIECE.find((s) => s.value === p.etat)?.label}</Badge>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 text-sm text-slate-600">
            <p>Élec. : {modalEdl.values.compteurs?.electricite || '—'}</p>
            <p>Eau : {modalEdl.values.compteurs?.eau || '—'}</p>
            <p>Gaz : {modalEdl.values.compteurs?.gaz || '—'}</p>
            <p>Clés : {modalEdl.values.nombreCles || 0}</p>
          </div>
          {modalEdl.values.observations && <p className="text-sm text-slate-600">{modalEdl.values.observations}</p>}
        </div>
      )}
    </Modal>
  )
}
