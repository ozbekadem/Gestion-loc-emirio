import React, { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import { useCrudModal } from '../lib/useCrudModal.js'
import { useConfirm } from '../lib/confirm.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Textarea, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate, createStatutLookup } from '../lib/utils.js'

const TYPES = [
  { value: 'visite', label: 'Visite', tone: 'blue' },
  { value: 'rendez_vous', label: 'Rendez-vous', tone: 'amber' },
  { value: 'echeance', label: 'Échéance', tone: 'red' },
  { value: 'autre', label: 'Autre', tone: 'slate' },
]

const typeInfo = createStatutLookup(TYPES, 3)

const emptyEvenement = { date: '', titre: '', description: '', type: 'autre' }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Agenda() {
  const { state, agenda } = useStore()
  const confirm = useConfirm()
  const modal = useCrudModal(agenda, emptyEvenement)

  async function remove(ev) {
    if (await confirm(`Supprimer l'événement "${ev.titre}" ?`, { danger: true })) agenda.remove(ev.id)
  }

  const trie = useMemo(() => [...state.agenda].sort((a, b) => new Date(a.date) - new Date(b.date)), [state.agenda])
  const today = todayISO()

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Visites, rendez-vous et échéances"
        action={<Button onClick={() => modal.openNew({ date: todayISO() })}>+ Ajouter un événement</Button>}
      />

      {trie.length === 0 ? (
        <EmptyState title="Aucun événement planifié" subtitle="Ajoutez une visite, un rendez-vous ou une échéance." action={<Button className="mt-2" onClick={() => modal.openNew({ date: todayISO() })}>Ajouter un événement</Button>} />
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
                    <Button variant="ghost" onClick={() => modal.openEdit(ev)}>Modifier</Button>
                    <Button variant="danger" onClick={() => remove(ev)}>Supprimer</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Modal
        open={!!modal.modal}
        onClose={modal.close}
        title={modal.modal?.mode === 'edit' ? "Modifier l'événement" : 'Ajouter un événement'}
        footer={
          <>
            <Button variant="secondary" onClick={modal.close}>Annuler</Button>
            <Button type="submit" form="form-evenement">Enregistrer</Button>
          </>
        }
      >
        {modal.modal && (
          <form id="form-evenement" onSubmit={modal.save} className="space-y-4">
            <Field label="Titre">
              <Input required value={modal.modal.values.titre} onChange={modal.field('titre')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <Input type="date" required value={modal.modal.values.date} onChange={modal.field('date')} />
              </Field>
              <Field label="Type">
                <Select value={modal.modal.values.type} onChange={modal.field('type')}>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={modal.modal.values.description} onChange={modal.field('description')} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
