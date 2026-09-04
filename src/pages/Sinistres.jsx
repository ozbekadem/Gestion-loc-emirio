import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Textarea, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate, formatMontant } from '../lib/utils.js'

const TYPES = ['Dégât des eaux', 'Incendie', 'Vol / cambriolage', 'Vandalisme', 'Bris de vitre', 'Autre']

const STATUTS = [
  { value: 'en_cours', label: 'En cours', tone: 'amber' },
  { value: 'clos', label: 'Clos', tone: 'green' },
]

const emptySinistre = {
  immeubleId: '', bienId: '', type: TYPES[0], compagnieAssurance: '', numeroDossier: '',
  dateSinistre: '', description: '', statut: 'en_cours', montantEstime: '',
}

export default function Sinistres() {
  const { state, sinistres } = useStore()
  const [modal, setModal] = useState(null)
  const [filtreImmeuble, setFiltreImmeuble] = useState('')

  function openNew() {
    setModal({ mode: 'create', values: emptySinistre })
  }
  function openEdit(s) {
    setModal({ mode: 'edit', id: s.id, values: { ...s } })
  }
  function save(e) {
    e.preventDefault()
    const { mode, id, values } = modal
    const payload = { ...values, montantEstime: Number(values.montantEstime) || 0 }
    if (mode === 'create') sinistres.add(payload)
    else sinistres.update(id, payload)
    setModal(null)
  }
  function remove(s) {
    if (confirm(`Supprimer le dossier de sinistre "${s.type}" ?`)) sinistres.remove(s.id)
  }

  const biensDeImmeuble = state.biens.filter((b) => b.immeubleId === modal?.values.immeubleId)
  const liste = state.sinistres.filter((s) => !filtreImmeuble || s.immeubleId === filtreImmeuble)

  function statutInfo(v) {
    return STATUTS.find((s) => s.value === v) || STATUTS[0]
  }

  return (
    <div>
      <PageHeader
        title="Sinistres & assurances"
        subtitle="Dossiers de sinistre suivis par immeuble"
        action={<Button onClick={openNew}>+ Déclarer un sinistre</Button>}
      />

      {state.immeubles.length > 0 && (
        <Select className="mb-4 max-w-xs" value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)}>
          <option value="">Tous les immeubles</option>
          {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
        </Select>
      )}

      {liste.length === 0 ? (
        <EmptyState title="Aucun dossier de sinistre" subtitle="Déclarez un sinistre pour en assurer le suivi." action={<Button className="mt-2" onClick={openNew}>Déclarer un sinistre</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Bien</th>
                  <th className="pb-2 pr-4">N° dossier</th>
                  <th className="pb-2 pr-4">Assurance</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Montant estimé</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {liste.map((s) => {
                  const immeuble = state.immeubles.find((i) => i.id === s.immeubleId)
                  const bien = state.biens.find((b) => b.id === s.bienId)
                  const info = statutInfo(s.statut)
                  return (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{s.type}</td>
                      <td className="py-2 pr-4 text-slate-600">{immeuble ? immeuble.nom : '—'}{bien ? ` — ${bien.nom}` : ''}</td>
                      <td className="py-2 pr-4 text-slate-600">{s.numeroDossier || '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{s.compagnieAssurance || '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatDate(s.dateSinistre)}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatMontant(s.montantEstime)}</td>
                      <td className="py-2 pr-4"><Badge tone={info.tone}>{info.label}</Badge></td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" onClick={() => openEdit(s)}>Modifier</Button>
                        <Button variant="danger" onClick={() => remove(s)}>Suppr.</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Modifier le sinistre' : 'Déclarer un sinistre'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-sinistre">Enregistrer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-sinistre" onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type de sinistre">
                <Select value={modal.values.type} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, type: e.target.value } }))}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Statut">
                <Select value={modal.values.statut} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, statut: e.target.value } }))}>
                  {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Immeuble">
                <Select value={modal.values.immeubleId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, immeubleId: e.target.value, bienId: '' } }))}>
                  <option value="">— Aucun —</option>
                  {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
                </Select>
              </Field>
              <Field label="Bien concerné">
                <Select value={modal.values.bienId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, bienId: e.target.value } }))}>
                  <option value="">— Aucun —</option>
                  {biensDeImmeuble.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Compagnie d'assurance">
                <Input value={modal.values.compagnieAssurance} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, compagnieAssurance: e.target.value } }))} />
              </Field>
              <Field label="N° de dossier">
                <Input value={modal.values.numeroDossier} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, numeroDossier: e.target.value } }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date du sinistre">
                <Input type="date" value={modal.values.dateSinistre} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, dateSinistre: e.target.value } }))} />
              </Field>
              <Field label="Montant estimé (€)">
                <Input type="number" min="0" value={modal.values.montantEstime} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, montantEstime: e.target.value } }))} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
