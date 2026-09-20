import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { useCrudModal } from '../lib/useCrudModal.js'
import { useConfirm } from '../lib/confirm.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, EmptyState } from '../components/ui.jsx'

const emptyPrestataire = { nom: '', metier: '', telephone: '', email: '', adresse: '' }

export default function Prestataires() {
  const { state, prestataires } = useStore()
  const confirm = useConfirm()
  const modal = useCrudModal(prestataires, emptyPrestataire)
  const [filtreMetier, setFiltreMetier] = useState('')

  const metiers = [...new Set(state.prestataires.map((p) => p.metier).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const listeFiltree = state.prestataires.filter((p) => !filtreMetier || p.metier === filtreMetier)

  async function remove(p) {
    if (await confirm(`Supprimer "${p.nom}" du carnet d'adresses ?`, { danger: true })) prestataires.remove(p.id)
  }

  return (
    <div>
      <PageHeader
        title="Prestataires"
        subtitle="Carnet d'adresses professionnel"
        action={<Button onClick={() => modal.openNew()}>+ Ajouter le prestataire</Button>}
      />

      {metiers.length > 0 && (
        <Select className="mb-4 max-w-xs" value={filtreMetier} onChange={(e) => setFiltreMetier(e.target.value)}>
          <option value="">Tous les métiers</option>
          {metiers.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      )}

      {state.prestataires.length === 0 ? (
        <EmptyState title="Aucun prestataire pour le moment" subtitle="Ajoutez vos artisans et professionnels de confiance." action={<Button className="mt-2" onClick={() => modal.openNew()}>Ajouter un prestataire</Button>} />
      ) : listeFiltree.length === 0 ? (
        <EmptyState title="Aucun prestataire pour ce métier" subtitle="Ajoutez-en un ou choisissez un autre métier dans le filtre." action={<Button className="mt-2" onClick={() => modal.openNew()}>Ajouter un prestataire</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listeFiltree.map((p) => (
            <Card key={p.id}>
              <h3 className="font-semibold text-slate-900">{p.nom}</h3>
              <p className="text-sm text-slate-500">{p.metier || 'Métier non renseigné'}</p>
              <div className="mt-2 space-y-0.5 text-sm text-slate-600">
                {p.telephone && <p>{p.telephone}</p>}
                {p.email && <p>{p.email}</p>}
                {p.adresse && <p>{p.adresse}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={() => modal.openEdit(p)}>Modifier</Button>
                <Button variant="danger" onClick={() => remove(p)}>Supprimer</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!modal.modal}
        onClose={modal.close}
        title={modal.modal?.mode === 'edit' ? 'Modifier le prestataire' : 'Ajouter le prestataire'}
        footer={
          <>
            <Button variant="secondary" onClick={modal.close}>Annuler</Button>
            <Button type="submit" form="form-prestataire">Enregistrer</Button>
          </>
        }
      >
        {modal.modal && (
          <form id="form-prestataire" onSubmit={modal.save} className="space-y-4">
            <Field label="Nom / raison sociale">
              <Input required value={modal.modal.values.nom} onChange={modal.field('nom')} />
            </Field>
            <Field label="Métier">
              <Input list="metiers-existants" placeholder="Plombier, électricien, ..." value={modal.modal.values.metier} onChange={modal.field('metier')} />
              <datalist id="metiers-existants">
                {metiers.map((m) => <option key={m} value={m} />)}
              </datalist>
            </Field>
            <Field label="Téléphone">
              <Input value={modal.modal.values.telephone} onChange={modal.field('telephone')} />
            </Field>
            <Field label="Adresse e-mail">
              <Input type="email" value={modal.modal.values.email} onChange={modal.field('email')} />
            </Field>
            <Field label="Adresse">
              <Input value={modal.modal.values.adresse} onChange={modal.field('adresse')} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
