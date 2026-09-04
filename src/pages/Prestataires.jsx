import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, EmptyState } from '../components/ui.jsx'

const emptyPrestataire = { nom: '', metier: '', telephone: '', email: '', adresse: '' }

export default function Prestataires() {
  const { state, prestataires } = useStore()
  const [modal, setModal] = useState(null)

  function openNew() {
    setModal({ mode: 'create', values: emptyPrestataire })
  }
  function openEdit(p) {
    setModal({ mode: 'edit', id: p.id, values: { ...p } })
  }
  function save(e) {
    e.preventDefault()
    const { mode, id, values } = modal
    if (mode === 'create') prestataires.add(values)
    else prestataires.update(id, values)
    setModal(null)
  }
  function remove(p) {
    if (confirm(`Supprimer "${p.nom}" du carnet d'adresses ?`)) prestataires.remove(p.id)
  }

  return (
    <div>
      <PageHeader
        title="Prestataires"
        subtitle="Carnet d'adresses professionnel"
        action={<Button onClick={openNew}>+ Ajouter le prestataire</Button>}
      />

      {state.prestataires.length === 0 ? (
        <EmptyState title="Aucun prestataire pour le moment" subtitle="Ajoutez vos artisans et professionnels de confiance." action={<Button className="mt-2" onClick={openNew}>Ajouter un prestataire</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.prestataires.map((p) => (
            <Card key={p.id}>
              <h3 className="font-semibold text-slate-900">{p.nom}</h3>
              <p className="text-sm text-slate-500">{p.metier || 'Métier non renseigné'}</p>
              <div className="mt-2 space-y-0.5 text-sm text-slate-600">
                {p.telephone && <p>{p.telephone}</p>}
                {p.email && <p>{p.email}</p>}
                {p.adresse && <p>{p.adresse}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={() => openEdit(p)}>Modifier</Button>
                <Button variant="danger" onClick={() => remove(p)}>Supprimer</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Modifier le prestataire' : 'Ajouter le prestataire'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-prestataire">Enregistrer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-prestataire" onSubmit={save} className="space-y-4">
            <Field label="Nom / raison sociale">
              <Input required value={modal.values.nom} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, nom: e.target.value } }))} />
            </Field>
            <Field label="Métier">
              <Input placeholder="Plombier, électricien, ..." value={modal.values.metier} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, metier: e.target.value } }))} />
            </Field>
            <Field label="Téléphone">
              <Input value={modal.values.telephone} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, telephone: e.target.value } }))} />
            </Field>
            <Field label="Adresse e-mail">
              <Input type="email" value={modal.values.email} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, email: e.target.value } }))} />
            </Field>
            <Field label="Adresse">
              <Input value={modal.values.adresse} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, adresse: e.target.value } }))} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
