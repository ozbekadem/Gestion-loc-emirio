import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, EmptyState, Badge } from '../components/ui.jsx'
import { formatDate, formatMontant } from '../lib/utils.js'

const STATUTS = [
  { value: 'actif', label: 'Actif', tone: 'green' },
  { value: 'termine', label: 'Terminé', tone: 'slate' },
  { value: 'resilie', label: 'Résilié', tone: 'red' },
]

const emptyBail = {
  locataireId: '', bienId: '', dateDebut: '', dateFin: '', loyer: '', charges: '', depotGarantie: '', statut: 'actif',
}

export default function Baux() {
  const { state, baux } = useStore()
  const [modal, setModal] = useState(null)

  function openNew() {
    setModal({ mode: 'create', values: emptyBail })
  }
  function openEdit(b) {
    setModal({ mode: 'edit', id: b.id, values: { ...b } })
  }
  function save(e) {
    e.preventDefault()
    const { mode, id, values } = modal
    const payload = { ...values, loyer: Number(values.loyer) || 0, charges: Number(values.charges) || 0, depotGarantie: Number(values.depotGarantie) || 0 }
    if (mode === 'create') baux.add(payload)
    else baux.update(id, payload)
    setModal(null)
  }
  function remove(b) {
    if (confirm('Supprimer ce bail ?')) baux.remove(b.id)
  }

  function statutInfo(v) {
    return STATUTS.find((s) => s.value === v) || STATUTS[0]
  }

  return (
    <div>
      <PageHeader
        title="Baux"
        subtitle="Contrats de location en cours et archivés"
        action={<Button onClick={openNew}>+ Créer un bail</Button>}
      />

      {state.baux.length === 0 ? (
        <EmptyState
          title="Aucun bail pour le moment"
          subtitle="Créez un bail en associant un locataire à un bien."
          action={<Button className="mt-2" onClick={openNew}>Créer mon premier bail</Button>}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Locataire</th>
                  <th className="pb-2 pr-4">Bien</th>
                  <th className="pb-2 pr-4">Début</th>
                  <th className="pb-2 pr-4">Fin</th>
                  <th className="pb-2 pr-4">Loyer + charges</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {state.baux.map((b) => {
                  const loc = state.locataires.find((l) => l.id === b.locataireId)
                  const bien = state.biens.find((x) => x.id === b.bienId)
                  const info = statutInfo(b.statut)
                  return (
                    <tr key={b.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{loc ? `${loc.prenom} ${loc.nom}` : '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{bien ? bien.nom : '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatDate(b.dateDebut)}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatDate(b.dateFin)}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatMontant(Number(b.loyer) + Number(b.charges))}</td>
                      <td className="py-2 pr-4"><Badge tone={info.tone}>{info.label}</Badge></td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" onClick={() => openEdit(b)}>Modifier</Button>
                        <Button variant="danger" onClick={() => remove(b)}>Suppr.</Button>
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
        title={modal?.mode === 'edit' ? 'Modifier le bail' : 'Créer un bail'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-bail">Enregistrer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-bail" onSubmit={save} className="space-y-4">
            <Field label="Locataire">
              <Select required value={modal.values.locataireId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, locataireId: e.target.value } }))}>
                <option value="">— Choisir —</option>
                {state.locataires.map((l) => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
              </Select>
            </Field>
            <Field label="Bien loué">
              <Select required value={modal.values.bienId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, bienId: e.target.value } }))}>
                <option value="">— Choisir —</option>
                {state.biens.map((b) => {
                  const immeuble = state.immeubles.find((i) => i.id === b.immeubleId)
                  return <option key={b.id} value={b.id}>{immeuble ? `${immeuble.nom} — ${b.nom}` : b.nom}</option>
                })}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date de début">
                <Input type="date" required value={modal.values.dateDebut} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, dateDebut: e.target.value } }))} />
              </Field>
              <Field label="Date de fin">
                <Input type="date" value={modal.values.dateFin} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, dateFin: e.target.value } }))} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Loyer (€)">
                <Input type="number" min="0" required value={modal.values.loyer} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, loyer: e.target.value } }))} />
              </Field>
              <Field label="Charges (€)">
                <Input type="number" min="0" value={modal.values.charges} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, charges: e.target.value } }))} />
              </Field>
              <Field label="Dépôt garantie (€)">
                <Input type="number" min="0" value={modal.values.depotGarantie} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, depotGarantie: e.target.value } }))} />
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
