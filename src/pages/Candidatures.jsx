import React from 'react'
import { useStore } from '../lib/store.jsx'
import { useCrudModal } from '../lib/useCrudModal.js'
import { useConfirm } from '../lib/confirm.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate } from '../lib/utils.js'

const STATUTS = [
  { value: 'nouvelle', label: 'Nouvelle', tone: 'blue' },
  { value: 'en_etude', label: 'En étude', tone: 'amber' },
  { value: 'acceptee', label: 'Acceptée', tone: 'green' },
  { value: 'refusee', label: 'Refusée', tone: 'red' },
]

const emptyCandidature = { bienId: '', nom: '', prenom: '', telephone: '', email: '', dateSouhaitee: '', statut: 'nouvelle' }

export default function Candidatures() {
  const { state, candidatures } = useStore()
  const confirm = useConfirm()
  const modal = useCrudModal(candidatures, emptyCandidature)

  async function remove(c) {
    if (await confirm(`Supprimer la candidature de ${c.prenom} ${c.nom} ?`, { danger: true })) candidatures.remove(c.id)
  }

  function statutInfo(v) {
    return STATUTS.find((s) => s.value === v) || STATUTS[0]
  }

  return (
    <div>
      <PageHeader
        title="Candidatures"
        subtitle="Dossiers de location reçus"
        action={<Button onClick={() => modal.openNew()}>+ Ajouter une candidature</Button>}
      />

      {state.candidatures.length === 0 ? (
        <EmptyState title="Aucune candidature pour le moment" subtitle="Les nouvelles demandes de location apparaîtront ici." action={<Button className="mt-2" onClick={() => modal.openNew()}>Ajouter une candidature</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Candidat</th>
                  <th className="pb-2 pr-4">Bien souhaité</th>
                  <th className="pb-2 pr-4">Date souhaitée</th>
                  <th className="pb-2 pr-4">Contact</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {state.candidatures.map((c) => {
                  const bien = state.biens.find((b) => b.id === c.bienId)
                  const info = statutInfo(c.statut)
                  return (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{c.prenom} {c.nom}</td>
                      <td className="py-2 pr-4 text-slate-600">{bien ? bien.nom : '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatDate(c.dateSouhaitee)}</td>
                      <td className="py-2 pr-4 text-slate-600">{c.telephone || c.email || '—'}</td>
                      <td className="py-2 pr-4"><Badge tone={info.tone}>{info.label}</Badge></td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" onClick={() => modal.openEdit(c)}>Modifier</Button>
                        <Button variant="danger" onClick={() => remove(c)}>Suppr.</Button>
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
        open={!!modal.modal}
        onClose={modal.close}
        title={modal.modal?.mode === 'edit' ? 'Modifier la candidature' : 'Ajouter une candidature'}
        footer={
          <>
            <Button variant="secondary" onClick={modal.close}>Annuler</Button>
            <Button type="submit" form="form-candidature">Enregistrer</Button>
          </>
        }
      >
        {modal.modal && (
          <form id="form-candidature" onSubmit={modal.save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom">
                <Input required value={modal.modal.values.prenom} onChange={modal.field('prenom')} />
              </Field>
              <Field label="Nom">
                <Input required value={modal.modal.values.nom} onChange={modal.field('nom')} />
              </Field>
            </div>
            <Field label="Bien souhaité">
              <Select value={modal.modal.values.bienId} onChange={modal.field('bienId')}>
                <option value="">— Aucun —</option>
                {state.biens.map((b) => {
                  const immeuble = state.immeubles.find((i) => i.id === b.immeubleId)
                  return <option key={b.id} value={b.id}>{immeuble ? `${immeuble.nom} — ${b.nom}` : b.nom}</option>
                })}
              </Select>
            </Field>
            <Field label="Téléphone">
              <Input value={modal.modal.values.telephone} onChange={modal.field('telephone')} />
            </Field>
            <Field label="Adresse e-mail">
              <Input type="email" value={modal.modal.values.email} onChange={modal.field('email')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date d'entrée souhaitée">
                <Input type="date" value={modal.modal.values.dateSouhaitee} onChange={modal.field('dateSouhaitee')} />
              </Field>
              <Field label="Statut">
                <Select value={modal.modal.values.statut} onChange={modal.field('statut')}>
                  {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
