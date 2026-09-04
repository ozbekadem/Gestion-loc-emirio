import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Textarea, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate, formatMontant } from '../lib/utils.js'

const STATUTS = [
  { value: 'a_planifier', label: 'À planifier', tone: 'slate' },
  { value: 'en_cours', label: 'En cours', tone: 'amber' },
  { value: 'termine', label: 'Terminé', tone: 'green' },
]

const emptyTravail = {
  immeubleId: '', bienId: '', titre: '', description: '', prestataireId: '', statut: 'a_planifier', cout: '', date: '',
}

export default function Travaux() {
  const { state, travaux } = useStore()
  const [modal, setModal] = useState(null)
  const [filtreImmeuble, setFiltreImmeuble] = useState('')

  function openNew() {
    setModal({ mode: 'create', values: emptyTravail })
  }
  function openEdit(t) {
    setModal({ mode: 'edit', id: t.id, values: { ...t } })
  }
  function save(e) {
    e.preventDefault()
    const { mode, id, values } = modal
    const payload = { ...values, cout: Number(values.cout) || 0 }
    if (mode === 'create') travaux.add(payload)
    else travaux.update(id, payload)
    setModal(null)
  }
  function remove(t) {
    if (confirm(`Supprimer le travail "${t.titre}" ?`)) travaux.remove(t.id)
  }

  const biensDeImmeuble = state.biens.filter((b) => b.immeubleId === modal?.values.immeubleId)
  const liste = state.travaux.filter((t) => !filtreImmeuble || t.immeubleId === filtreImmeuble)

  function statutInfo(v) {
    return STATUTS.find((s) => s.value === v) || STATUTS[0]
  }

  return (
    <div>
      <PageHeader
        title="Travaux"
        subtitle="Suivi des interventions et de leur coût"
        action={<Button onClick={openNew}>+ Ajouter un travail</Button>}
      />

      {state.immeubles.length > 0 && (
        <Select className="mb-4 max-w-xs" value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)}>
          <option value="">Tous les immeubles</option>
          {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
        </Select>
      )}

      {liste.length === 0 ? (
        <EmptyState title="Aucun travail pour cet immeuble" subtitle="Ajoutez une intervention à planifier ou en cours." action={<Button className="mt-2" onClick={openNew}>Ajouter un travail</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((t) => {
            const immeuble = state.immeubles.find((i) => i.id === t.immeubleId)
            const bien = state.biens.find((b) => b.id === t.bienId)
            const prestataire = state.prestataires.find((p) => p.id === t.prestataireId)
            const info = statutInfo(t.statut)
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900">{t.titre}</h3>
                  <Badge tone={info.tone}>{info.label}</Badge>
                </div>
                {t.description && <p className="mt-1 text-sm text-slate-500">{t.description}</p>}
                <div className="mt-3 space-y-0.5 text-sm text-slate-600">
                  <p>{immeuble ? immeuble.nom : '—'}{bien ? ` — ${bien.nom}` : ''}</p>
                  {prestataire && <p>Prestataire : {prestataire.nom}</p>}
                  {t.date && <p>Date : {formatDate(t.date)}</p>}
                  <p className="font-medium text-slate-800">{formatMontant(t.cout)}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" onClick={() => openEdit(t)}>Modifier</Button>
                  <Button variant="danger" onClick={() => remove(t)}>Supprimer</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Modifier le travail' : 'Ajouter un travail'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-travail">Enregistrer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-travail" onSubmit={save} className="space-y-4">
            <Field label="Titre">
              <Input required value={modal.values.titre} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, titre: e.target.value } }))} />
            </Field>
            <Field label="Description">
              <Textarea value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
            </Field>
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
            <Field label="Prestataire">
              <Select value={modal.values.prestataireId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, prestataireId: e.target.value } }))}>
                <option value="">— Aucun —</option>
                {state.prestataires.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Coût (€)">
                <Input type="number" min="0" value={modal.values.cout} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, cout: e.target.value } }))} />
              </Field>
              <Field label="Date">
                <Input type="date" value={modal.values.date} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, date: e.target.value } }))} />
              </Field>
            </div>
            <Field label="Statut">
              <Select value={modal.values.statut} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, statut: e.target.value } }))}>
                {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
