import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { useCrudModal } from '../lib/useCrudModal.js'
import { useConfirm } from '../lib/confirm.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, EmptyState, Badge } from '../components/ui.jsx'
import { formatMontant } from '../lib/utils.js'

const TYPES = ['Immeuble résidentiel', 'Maison', 'Immeuble mixte', 'Local commercial', 'Autre']

const emptyImmeuble = {
  nom: '', adresse: '', codePostal: '', ville: '', type: TYPES[0],
  proprietaireNom: '', proprietaireEmail: '', proprietaireTelephone: '',
}
const emptyBien = { nom: '', etage: '', surface: '', loyerBase: '', charges: '' }

function coercerBien(values) {
  return { ...values, surface: Number(values.surface) || 0, loyerBase: Number(values.loyerBase) || 0, charges: Number(values.charges) || 0 }
}

export default function Immeubles() {
  const { state, immeubles, biens } = useStore()
  const confirm = useConfirm()
  const immeubleModal = useCrudModal(immeubles, emptyImmeuble)
  const bienModal = useCrudModal(biens, emptyBien, coercerBien)
  const [expanded, setExpanded] = useState(null)

  const list = state.immeubles

  async function deleteImmeuble(im) {
    const unites = state.biens.filter((b) => b.immeubleId === im.id)
    if (unites.length > 0) {
      await confirm("Impossible de supprimer : cet immeuble contient encore des biens. Supprimez d'abord les biens.", { okOnly: true })
      return
    }
    if (await confirm(`Supprimer l'immeuble "${im.nom}" ?`, { danger: true })) immeubles.remove(im.id)
  }

  async function deleteBien(bien) {
    const occupe = state.locataires.some((l) => l.bienId === bien.id)
    if (occupe) {
      await confirm('Impossible de supprimer : ce bien est occupé par un locataire.', { okOnly: true })
      return
    }
    if (await confirm(`Supprimer le bien "${bien.nom}" ?`, { danger: true })) biens.remove(bien.id)
  }

  return (
    <div>
      <PageHeader
        title="Immeubles"
        subtitle="Gérez votre patrimoine et les biens qui le composent"
        action={<Button onClick={() => immeubleModal.openNew()}>+ Ajouter un immeuble</Button>}
      />

      {list.length === 0 ? (
        <EmptyState
          title="Aucun immeuble pour le moment"
          subtitle="Commencez par ajouter votre premier immeuble."
          action={<Button className="mt-2" onClick={() => immeubleModal.openNew()}>Ajouter mon premier immeuble</Button>}
        />
      ) : (
        <div className="space-y-4">
          {list.map((im) => {
            const unites = state.biens.filter((b) => b.immeubleId === im.id)
            const isOpen = expanded === im.id
            return (
              <Card key={im.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{im.nom}</h3>
                    <p className="text-sm text-slate-500">{im.adresse}, {im.codePostal} {im.ville}</p>
                    <Badge tone="slate">{im.type}</Badge>
                    {im.proprietaireNom && (
                      <p className="mt-1 text-xs text-slate-400">Propriétaire : {im.proprietaireNom}{im.proprietaireEmail ? ` — ${im.proprietaireEmail}` : ''}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setExpanded(isOpen ? null : im.id)}>
                      {unites.length} bien{unites.length > 1 ? 's' : ''} {isOpen ? '▲' : '▼'}
                    </Button>
                    <Button variant="ghost" onClick={() => immeubleModal.openEdit(im)}>Modifier</Button>
                    <Button variant="danger" onClick={() => deleteImmeuble(im)}>Supprimer</Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Biens</h4>
                      <Button variant="secondary" onClick={() => bienModal.openNew({ immeubleId: im.id })}>+ Ajouter un bien</Button>
                    </div>
                    {unites.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucun bien dans cet immeuble.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-slate-500">
                              <th className="pb-2 pr-4">Nom</th>
                              <th className="pb-2 pr-4">Étage</th>
                              <th className="pb-2 pr-4">Surface</th>
                              <th className="pb-2 pr-4">Loyer</th>
                              <th className="pb-2 pr-4">Locataire</th>
                              <th className="pb-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {unites.map((b) => {
                              const occupant = state.locataires.find((l) => l.bienId === b.id)
                              return (
                                <tr key={b.id} className="border-t border-slate-100">
                                  <td className="py-2 pr-4 font-medium text-slate-800">{b.nom}</td>
                                  <td className="py-2 pr-4 text-slate-600">{b.etage || '—'}</td>
                                  <td className="py-2 pr-4 text-slate-600">{b.surface ? `${b.surface} m²` : '—'}</td>
                                  <td className="py-2 pr-4 text-slate-600">{formatMontant(b.loyerBase)}</td>
                                  <td className="py-2 pr-4 text-slate-600">
                                    {occupant ? `${occupant.prenom} ${occupant.nom}` : <span className="text-slate-400">Vacant</span>}
                                  </td>
                                  <td className="py-2 text-right">
                                    <Button variant="ghost" onClick={() => bienModal.openEdit(b)}>Modifier</Button>
                                    <Button variant="danger" onClick={() => deleteBien(b)}>Suppr.</Button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!immeubleModal.modal}
        onClose={immeubleModal.close}
        title={immeubleModal.modal?.mode === 'edit' ? "Modifier l'immeuble" : "Ajouter l'immeuble"}
        footer={
          <>
            <Button variant="secondary" onClick={immeubleModal.close}>Annuler</Button>
            <Button type="submit" form="form-immeuble">Enregistrer</Button>
          </>
        }
      >
        {immeubleModal.modal && (
          <form id="form-immeuble" onSubmit={immeubleModal.save} className="space-y-4">
            <Field label="Nom">
              <Input required value={immeubleModal.modal.values.nom} onChange={immeubleModal.field('nom')} />
            </Field>
            <Field label="Adresse">
              <Input required value={immeubleModal.modal.values.adresse} onChange={immeubleModal.field('adresse')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Code postal">
                <Input value={immeubleModal.modal.values.codePostal} onChange={immeubleModal.field('codePostal')} />
              </Field>
              <Field label="Ville">
                <Input value={immeubleModal.modal.values.ville} onChange={immeubleModal.field('ville')} />
              </Field>
            </div>
            <Field label="Type">
              <Select value={immeubleModal.modal.values.type} onChange={immeubleModal.field('type')}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-3 text-sm font-semibold text-slate-700">Propriétaire</p>
              <div className="space-y-4">
                <Field label="Nom du propriétaire">
                  <Input value={immeubleModal.modal.values.proprietaireNom} onChange={immeubleModal.field('proprietaireNom')} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="E-mail">
                    <Input type="email" value={immeubleModal.modal.values.proprietaireEmail} onChange={immeubleModal.field('proprietaireEmail')} />
                  </Field>
                  <Field label="Téléphone">
                    <Input value={immeubleModal.modal.values.proprietaireTelephone} onChange={immeubleModal.field('proprietaireTelephone')} />
                  </Field>
                </div>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!bienModal.modal}
        onClose={bienModal.close}
        title={bienModal.modal?.mode === 'edit' ? 'Modifier le bien' : 'Ajouter un bien'}
        footer={
          <>
            <Button variant="secondary" onClick={bienModal.close}>Annuler</Button>
            <Button type="submit" form="form-bien">Enregistrer</Button>
          </>
        }
      >
        {bienModal.modal && (
          <form id="form-bien" onSubmit={bienModal.save} className="space-y-4">
            <Field label="Nom du bien">
              <Input required placeholder="Appartement 1A" value={bienModal.modal.values.nom} onChange={bienModal.field('nom')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Étage">
                <Input value={bienModal.modal.values.etage} onChange={bienModal.field('etage')} />
              </Field>
              <Field label="Surface (m²)">
                <Input type="number" min="0" value={bienModal.modal.values.surface} onChange={bienModal.field('surface')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Loyer de base (€)">
                <Input type="number" min="0" value={bienModal.modal.values.loyerBase} onChange={bienModal.field('loyerBase')} />
              </Field>
              <Field label="Charges (€)">
                <Input type="number" min="0" value={bienModal.modal.values.charges} onChange={bienModal.field('charges')} />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
