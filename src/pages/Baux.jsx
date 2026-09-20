import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { useCrudModal } from '../lib/useCrudModal.js'
import { useConfirm } from '../lib/confirm.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, EmptyState, Badge } from '../components/ui.jsx'
import { formatDate, formatMontant } from '../lib/utils.js'
import { CHECKLIST_ADMIN } from '../lib/taches.js'

const STATUTS = [
  { value: 'actif', label: 'Actif', tone: 'green' },
  { value: 'termine', label: 'Terminé', tone: 'slate' },
  { value: 'resilie', label: 'Résilié', tone: 'red' },
]

const FREQUENCES = [
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'bimensuel', label: 'Bimensuel' },
  { value: 'trimestriel', label: 'Trimestriel' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
]

function labelFrequence(v) {
  return FREQUENCES.find((f) => f.value === v)?.label || 'Mensuel'
}

const emptyBail = {
  locataireId: '', bienId: '', dateDebut: '', dateFin: '', loyer: '', charges: '', depotGarantie: '', statut: 'actif',
  frequence: 'mensuel', loyerInitial: '', indiceInitial: '', indiceActuel: '', dateIndexation: '',
  fraisGestion: '', dateEntretienChaudiere: '', dateAttestationAssurance: '', dateVisiteAnnuelle: '', dateOres: '', dateSwde: '',
}

function loyerIndexe(values) {
  const initial = Number(values.loyerInitial)
  const iInitial = Number(values.indiceInitial)
  const iActuel = Number(values.indiceActuel)
  if (!initial || !iInitial || !iActuel) return null
  return Math.round((initial * iActuel) / iInitial * 100) / 100
}

function coercerBail(values) {
  return {
    ...values,
    loyer: Number(values.loyer) || 0,
    charges: Number(values.charges) || 0,
    depotGarantie: Number(values.depotGarantie) || 0,
    loyerInitial: values.loyerInitial === '' ? Number(values.loyer) || 0 : Number(values.loyerInitial),
    indiceInitial: values.indiceInitial === '' ? '' : Number(values.indiceInitial),
    indiceActuel: values.indiceActuel === '' ? '' : Number(values.indiceActuel),
    fraisGestion: Number(values.fraisGestion) || 0,
  }
}

export default function Baux() {
  const { state, baux, paiements, etatsDesLieux } = useStore()
  const confirm = useConfirm()
  const bailModal = useCrudModal(baux, emptyBail, coercerBail)
  const [recherche, setRecherche] = useState('')
  const [filtreImmeuble, setFiltreImmeuble] = useState('')

  const bauxAffiches = state.baux.filter((b) => {
    const loc = state.locataires.find((l) => l.id === b.locataireId)
    const bien = state.biens.find((x) => x.id === b.bienId)
    const matchImmeuble = !filtreImmeuble || bien?.immeubleId === filtreImmeuble
    const matchRecherche = !recherche || `${loc?.prenom} ${loc?.nom}`.toLowerCase().includes(recherche.toLowerCase())
    return matchImmeuble && matchRecherche
  })

  async function remove(b) {
    // Un bail supprimé sans nettoyer ses paiements et états des lieux laisserait
    // des enregistrements orphelins (bailId pointant vers rien) qui continueraient
    // à être comptés dans les reversements et la comptabilité, invisibles et
    // impossibles à corriger depuis l'interface. On les supprime donc en cascade.
    const paiementsAssocies = state.paiements.filter((p) => p.bailId === b.id)
    const edlAssocies = state.etatsDesLieux.filter((e) => e.bailId === b.id)
    const avertissement = paiementsAssocies.length > 0
      ? ` ${paiementsAssocies.length} paiement${paiementsAssocies.length > 1 ? 's' : ''} enregistré${paiementsAssocies.length > 1 ? 's' : ''} pour ce bail seront également supprimés.`
      : ''
    if (!(await confirm(`Supprimer ce bail ?${avertissement}`, { danger: true }))) return
    paiementsAssocies.forEach((p) => paiements.remove(p.id))
    edlAssocies.forEach((e) => etatsDesLieux.remove(e.id))
    baux.remove(b.id)
  }

  function statutInfo(v) {
    return STATUTS.find((s) => s.value === v) || STATUTS[0]
  }

  return (
    <div>
      <PageHeader
        title="Baux"
        subtitle="Contrats de location en cours et archivés"
        action={<Button onClick={() => bailModal.openNew()}>+ Créer un bail</Button>}
      />

      {state.baux.length === 0 ? (
        <EmptyState
          title="Aucun bail pour le moment"
          subtitle="Créez un bail en associant un locataire à un bien."
          action={<Button className="mt-2" onClick={() => bailModal.openNew()}>Créer mon premier bail</Button>}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              placeholder="Rechercher un locataire..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="max-w-sm"
            />
            {state.immeubles.length > 0 && (
              <Select value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)} className="max-w-xs">
                <option value="">Tous les immeubles</option>
                {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
              </Select>
            )}
          </div>
          <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Locataire</th>
                  <th className="pb-2 pr-4">Immeuble</th>
                  <th className="pb-2 pr-4">Bien</th>
                  <th className="pb-2 pr-4">Début</th>
                  <th className="pb-2 pr-4">Fin</th>
                  <th className="pb-2 pr-4">Loyer + charges</th>
                  <th className="pb-2 pr-4">Fréquence</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {bauxAffiches.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-400">Aucun bail ne correspond à ce filtre.</td></tr>
                )}
                {bauxAffiches.map((b) => {
                  const loc = state.locataires.find((l) => l.id === b.locataireId)
                  const bien = state.biens.find((x) => x.id === b.bienId)
                  const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
                  const info = statutInfo(b.statut)
                  return (
                    <tr key={b.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{loc ? `${loc.prenom} ${loc.nom}` : '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{immeuble ? immeuble.nom : '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{bien ? bien.nom : '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatDate(b.dateDebut)}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatDate(b.dateFin)}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatMontant(Number(b.loyer) + Number(b.charges))}</td>
                      <td className="py-2 pr-4 text-slate-600">{labelFrequence(b.frequence)}</td>
                      <td className="py-2 pr-4"><Badge tone={info.tone}>{info.label}</Badge></td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" onClick={() => bailModal.openEdit(b)}>Modifier</Button>
                        <Button variant="danger" onClick={() => remove(b)}>Suppr.</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </Card>
        </>
      )}

      <Modal
        open={!!bailModal.modal}
        onClose={bailModal.close}
        title={bailModal.modal?.mode === 'edit' ? 'Modifier le bail' : 'Créer un bail'}
        footer={
          <>
            <Button variant="secondary" onClick={bailModal.close}>Annuler</Button>
            <Button type="submit" form="form-bail">Enregistrer</Button>
          </>
        }
      >
        {bailModal.modal && (
          <form id="form-bail" onSubmit={bailModal.save} className="space-y-4">
            <Field label="Locataire">
              <Select required value={bailModal.modal.values.locataireId} onChange={bailModal.field('locataireId')}>
                <option value="">— Choisir —</option>
                {state.locataires.map((l) => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
              </Select>
            </Field>
            <Field label="Bien loué">
              <Select required value={bailModal.modal.values.bienId} onChange={bailModal.field('bienId')}>
                <option value="">— Choisir —</option>
                {state.biens.map((b) => {
                  const immeuble = state.immeubles.find((i) => i.id === b.immeubleId)
                  return <option key={b.id} value={b.id}>{immeuble ? `${immeuble.nom} — ${b.nom}` : b.nom}</option>
                })}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date de début">
                <Input type="date" required value={bailModal.modal.values.dateDebut} onChange={bailModal.field('dateDebut')} />
              </Field>
              <Field label="Date de fin">
                <Input type="date" value={bailModal.modal.values.dateFin} onChange={bailModal.field('dateFin')} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Loyer (€)">
                <Input type="number" min="0" required value={bailModal.modal.values.loyer} onChange={bailModal.field('loyer')} />
              </Field>
              <Field label="Charges (€)">
                <Input type="number" min="0" value={bailModal.modal.values.charges} onChange={bailModal.field('charges')} />
              </Field>
              <Field label="Dépôt garantie (€)">
                <Input type="number" min="0" value={bailModal.modal.values.depotGarantie} onChange={bailModal.field('depotGarantie')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fréquence de paiement">
                <Select value={bailModal.modal.values.frequence} onChange={bailModal.field('frequence')}>
                  {FREQUENCES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label="Statut">
                <Select value={bailModal.modal.values.statut} onChange={bailModal.field('statut')}>
                  {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-3 text-sm font-semibold text-slate-700">Indexation du loyer</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Loyer initial (€)">
                  <Input type="number" min="0" placeholder={bailModal.modal.values.loyer || '0'} value={bailModal.modal.values.loyerInitial} onChange={bailModal.field('loyerInitial')} />
                </Field>
                <Field label="Date d'indexation">
                  <Input type="date" value={bailModal.modal.values.dateIndexation} onChange={bailModal.field('dateIndexation')} />
                </Field>
                <Field label="Indice de référence initial">
                  <Input type="number" step="0.01" min="0" value={bailModal.modal.values.indiceInitial} onChange={bailModal.field('indiceInitial')} />
                </Field>
                <Field label="Indice actuel">
                  <Input type="number" step="0.01" min="0" value={bailModal.modal.values.indiceActuel} onChange={bailModal.field('indiceActuel')} />
                </Field>
              </div>
              {loyerIndexe(bailModal.modal.values) !== null && (
                <div className="mt-3 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-600">Loyer indexé calculé : <strong className="text-slate-900">{formatMontant(loyerIndexe(bailModal.modal.values))}</strong></span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => bailModal.setValues((v) => ({ loyer: String(loyerIndexe(v)) }))}
                  >
                    Appliquer au loyer
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Suivi administratif du dossier</p>
                <Field label="">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Frais de gestion (€/mois)</span>
                    <Input
                      type="number" min="0" className="w-24"
                      value={bailModal.modal.values.fraisGestion}
                      onChange={bailModal.field('fraisGestion')}
                    />
                  </div>
                </Field>
              </div>
              <div className="space-y-3">
                {CHECKLIST_ADMIN.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 text-sm text-slate-600">{item.label}</span>
                    <Input
                      type="date"
                      value={bailModal.modal.values[item.key]}
                      onChange={bailModal.field(item.key)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => bailModal.setValues({ [item.key]: new Date().toISOString().slice(0, 10) })}
                    >
                      Fait aujourd'hui
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
