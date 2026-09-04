import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Textarea, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate } from '../lib/utils.js'

const TYPES = [
  { value: 'visite', label: 'Visite', tone: 'blue' },
  { value: 'rendez_vous', label: 'Rendez-vous', tone: 'amber' },
  { value: 'echeance', label: 'Échéance', tone: 'red' },
  { value: 'autre', label: 'Autre', tone: 'slate' },
]

const emptyEvenement = { date: '', titre: '', description: '', type: 'autre' }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Agenda() {
  const { state, agenda } = useStore()
  const [modal, setModal] = useState(null)

  function openNew() {
    setModal({ mode: 'create', values: { ...emptyEvenement, date: todayISO() } })
  }
  function openEdit(ev) {
    setModal({ mode: 'edit', id: ev.id, values: { ...ev } })
  }
  function save(e) {
    e.preventDefault()
    const { mode, id, values } = modal
    if (mode === 'create') agenda.add(values)
    else agenda.update(id, values)
    setModal(null)
  }
  function remove(ev) {
    if (confirm(`Supprimer l'événement "${ev.titre}" ?`)) agenda.remove(ev.id)
  }

  const trie = useMemo(() => [...state.agenda].sort((a, b) => new Date(a.date) - new Date(b.date)), [state.agenda])
  const today = todayISO()

  function typeInfo(v) {
    return TYPES.find((t) => t.value === v) || TYPES[3]
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Visites, rendez-vous et échéances"
        action={<Button onClick={openNew}>+ Ajouter un événement</Button>}
      />

      {trie.length === 0 ? (
        <EmptyState title="Aucun événement planifié" subtitle="Ajoutez une visite, un rendez-vous ou une échéance." action={<Button className="mt-2" onClick={openNew}>Ajouter un événement</Button>} />
      ) : (
        <Card>
          <div className="divide-y divide-slate-100">
            {trie.map((ev) => {
              const info = typeInfo(ev.type)
              const passe = ev.date < today
              return (
                <div key={ev.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${passe ? 'opacity-50' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{ev.titre}</p>
                      <Badge tone={info.tone}>{info.label}</Badge>
                      {ev.date === today && <Badge tone="green">Aujourd'hui</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(ev.date)}{ev.description ? ` — ${ev.description}` : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => openEdit(ev)}>Modifier</Button>
                    <Button variant="danger" onClick={() => remove(ev)}>Supprimer</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? "Modifier l'événement" : 'Ajouter un événement'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-evenement">Enregistrer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-evenement" onSubmit={save} className="space-y-4">
            <Field label="Titre">
              <Input required value={modal.values.titre} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, titre: e.target.value } }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <Input type="date" required value={modal.values.date} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, date: e.target.value } }))} />
              </Field>
              <Field label="Type">
                <Select value={modal.values.type} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, type: e.target.value } }))}>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
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
