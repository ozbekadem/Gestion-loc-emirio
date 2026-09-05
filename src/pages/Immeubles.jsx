import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, EmptyState, Badge } from '../components/ui.jsx'
import { formatMontant } from '../lib/utils.js'

const TYPES = ['Immeuble résidentiel', 'Maison', 'Immeuble mixte', 'Local commercial', 'Autre']

const emptyImmeuble = {
  nom: '', adresse: '', codePostal: '', ville: '', type: TYPES[0],
  proprietaireNom: '', proprietaireEmail: '', proprietaireTelephone: '',
}
const emptyBien = { nom: '', etage: '', surface: '', loyerBase: '', charges: '' }

export default function Immeubles() {
  const { state, immeubles, biens, locataires } = useStore()
  const [modalImmeuble, setModalImmeuble] = useState(null)
  const [modalBien, setModalBien] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const list = state.immeubles

  function openNewImmeuble() {
    setModalImmeuble({ mode: 'create', values: emptyImmeuble })
  }
  function openEditImmeuble(im) {
    setModalImmeuble({ mode: 'edit', id: im.id, values: { ...im } })
  }
  function saveImmeuble(e) {
    e.preventDefault()
    const { mode, id, values } = modalImmeuble
    if (mode === 'create') immeubles.add(values)
    else immeubles.update(id, values)
    setModalImmeuble(null)
  }
  function deleteImmeuble(im) {
    const unites = state.biens.filter((b) => b.immeubleId === im.id)
    if (unites.length > 0) {
      alert("Impossible de supprimer : cet immeuble contient encore des biens. Supprimez d'abord les biens.")
      return
    }
    if (confirm(`Supprimer l'immeuble "${im.nom}" ?`)) immeubles.remove(im.id)
  }

  function openNewBien(immeubleId) {
    setModalBien({ mode: 'create', immeubleId, values: emptyBien })
  }
  function openEditBien(bien) {
    setModalBien({ mode: 'edit', id: bien.id, immeubleId: bien.immeubleId, values: { ...bien } })
  }
  function saveBien(e) {
    e.preventDefault()
    const { mode, id, immeubleId, values } = modalBien
    const payload = { ...values, immeubleId, surface: Number(values.surface) || 0, loyerBase: Number(values.loyerBase) || 0, charges: Number(values.charges) || 0 }
    if (mode === 'create') biens.add(payload)
    else biens.update(id, payload)
    setModalBien(null)
  }
  function deleteBien(bien) {
    const occupe = state.locataires.some((l) => l.bienId === bien.id)
    if (occupe) {
      alert('Impossible de supprimer : ce bien est occupé par un locataire.')
      return
    }
    if (confirm(`Supprimer le bien "${bien.nom}" ?`)) biens.remove(bien.id)
  }

  return (
    <div>
      <PageHeader
        title="Immeubles"
        subtitle="Gérez votre patrimoine et les biens qui le composent"
        action={<Button onClick={openNewImmeuble}>+ Ajouter un immeuble</Button>}
      />

      {list.length === 0 ? (
        <EmptyState
          title="Aucun immeuble pour le moment"
          subtitle="Commencez par ajouter votre premier immeuble."
          action={<Button className="mt-2" onClick={openNewImmeuble}>Ajouter mon premier immeuble</Button>}
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
                    <Button variant="ghost" onClick={() => openEditImmeuble(im)}>Modifier</Button>
                    <Button variant="danger" onClick={() => deleteImmeuble(im)}>Supprimer</Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Biens</h4>
                      <Button variant="secondary" onClick={() => openNewBien(im.id)}>+ Ajouter un bien</Button>
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
                                    <Button variant="ghost" onClick={() => openEditBien(b)}>Modifier</Button>
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
        open={!!modalImmeuble}
        onClose={() => setModalImmeuble(null)}
        title={modalImmeuble?.mode === 'edit' ? "Modifier l'immeuble" : "Ajouter l'immeuble"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalImmeuble(null)}>Annuler</Button>
            <Button type="submit" form="form-immeuble">Enregistrer</Button>
          </>
        }
      >
        {modalImmeuble && (
          <form id="form-immeuble" onSubmit={saveImmeuble} className="space-y-4">
            <Field label="Nom">
              <Input required value={modalImmeuble.values.nom} onChange={(e) => setModalImmeuble((m) => ({ ...m, values: { ...m.values, nom: e.target.value } }))} />
            </Field>
            <Field label="Adresse">
              <Input required value={modalImmeuble.values.adresse} onChange={(e) => setModalImmeuble((m) => ({ ...m, values: { ...m.values, adresse: e.target.value } }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Code postal">
                <Input value={modalImmeuble.values.codePostal} onChange={(e) => setModalImmeuble((m) => ({ ...m, values: { ...m.values, codePostal: e.target.value } }))} />
              </Field>
              <Field label="Ville">
                <Input value={modalImmeuble.values.ville} onChange={(e) => setModalImmeuble((m) => ({ ...m, values: { ...m.values, ville: e.target.value } }))} />
              </Field>
            </div>
            <Field label="Type">
              <Select value={modalImmeuble.values.type} onChange={(e) => setModalImmeuble((m) => ({ ...m, values: { ...m.values, type: e.target.value } }))}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-3 text-sm font-semibold text-slate-700">Propriétaire</p>
              <div className="space-y-4">
                <Field label="Nom du propriétaire">
                  <Input value={modalImmeuble.values.proprietaireNom} onChange={(e) => setModalImmeuble((m) => ({ ...m, values: { ...m.values, proprietaireNom: e.target.value } }))} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="E-mail">
                    <Input type="email" value={modalImmeuble.values.proprietaireEmail} onChange={(e) => setModalImmeuble((m) => ({ ...m, values: { ...m.values, proprietaireEmail: e.target.value } }))} />
                  </Field>
                  <Field label="Téléphone">
                    <Input value={modalImmeuble.values.proprietaireTelephone} onChange={(e) => setModalImmeuble((m) => ({ ...m, values: { ...m.values, proprietaireTelephone: e.target.value } }))} />
                  </Field>
                </div>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!modalBien}
        onClose={() => setModalBien(null)}
        title={modalBien?.mode === 'edit' ? 'Modifier le bien' : 'Ajouter un bien'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalBien(null)}>Annuler</Button>
            <Button type="submit" form="form-bien">Enregistrer</Button>
          </>
        }
      >
        {modalBien && (
          <form id="form-bien" onSubmit={saveBien} className="space-y-4">
            <Field label="Nom du bien">
              <Input required placeholder="Appartement 1A" value={modalBien.values.nom} onChange={(e) => setModalBien((m) => ({ ...m, values: { ...m.values, nom: e.target.value } }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Étage">
                <Input value={modalBien.values.etage} onChange={(e) => setModalBien((m) => ({ ...m, values: { ...m.values, etage: e.target.value } }))} />
              </Field>
              <Field label="Surface (m²)">
                <Input type="number" min="0" value={modalBien.values.surface} onChange={(e) => setModalBien((m) => ({ ...m, values: { ...m.values, surface: e.target.value } }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Loyer de base (€)">
                <Input type="number" min="0" value={modalBien.values.loyerBase} onChange={(e) => setModalBien((m) => ({ ...m, values: { ...m.values, loyerBase: e.target.value } }))} />
              </Field>
              <Field label="Charges (€)">
                <Input type="number" min="0" value={modalBien.values.charges} onChange={(e) => setModalBien((m) => ({ ...m, values: { ...m.values, charges: e.target.value } }))} />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
