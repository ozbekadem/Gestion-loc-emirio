import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Textarea, EmptyState, Badge } from '../components/ui.jsx'
import { formatDate, moisCourant, statutPaiementInfo } from '../lib/utils.js'
import DossierLocataire from './DossierLocataire.jsx'

const STATUTS = [
  { value: 'excellent_payeur', label: 'Excellent payeur', tone: 'green' },
  { value: 'bon_payeur', label: 'Bon payeur', tone: 'blue' },
  { value: 'mauvais_payeur', label: 'Mauvais payeur', tone: 'red' },
  { value: 'nouveau', label: 'Nouveau', tone: 'slate' },
]

const FILTRES_PAIEMENT = [
  { value: '', label: 'Tous les paiements' },
  { value: 'retard', label: 'En retard ce mois' },
  { value: 'partiel', label: 'Partiel ce mois' },
  { value: 'paye', label: 'Payé ce mois' },
]

const emptyLocataire = { nom: '', prenom: '', email: '', telephone: '', bienId: '', dateEntree: '', statut: 'nouveau', notes: '' }

export default function Locataires() {
  const { state, locataires } = useStore()
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filtreImmeuble, setFiltreImmeuble] = useState('')
  const [filtrePaiement, setFiltrePaiement] = useState('')
  const [dossierId, setDossierId] = useState(null)

  const mois = moisCourant()

  const paiementDuMois = useMemo(() => {
    const map = new Map()
    state.locataires.forEach((l) => {
      const bail = state.baux.find((b) => b.locataireId === l.id && b.statut === 'actif')
      if (!bail) return
      const paiement = state.paiements.find((p) => p.bailId === bail.id && p.mois === mois)
      map.set(l.id, paiement?.statut || 'attendu')
    })
    return map
  }, [state.locataires, state.baux, state.paiements, mois])

  const list = state.locataires.filter((l) => {
    const bien = state.biens.find((b) => b.id === l.bienId)
    const matchImmeuble = !filtreImmeuble || bien?.immeubleId === filtreImmeuble
    const matchSearch = `${l.prenom} ${l.nom} ${l.email}`.toLowerCase().includes(search.toLowerCase())
    const matchPaiement = !filtrePaiement || paiementDuMois.get(l.id) === filtrePaiement
    return matchImmeuble && matchSearch && matchPaiement
  })

  if (dossierId) {
    return <DossierLocataire locataireId={dossierId} onBack={() => setDossierId(null)} />
  }

  function openNew() {
    setModal({ mode: 'create', values: emptyLocataire })
  }
  function openEdit(l) {
    setModal({ mode: 'edit', id: l.id, values: { ...l } })
  }
  function save(e) {
    e.preventDefault()
    const { mode, id, values } = modal
    if (mode === 'create') locataires.add(values)
    else locataires.update(id, values)
    setModal(null)
  }
  function remove(l) {
    const aUnBail = state.baux.some((b) => b.locataireId === l.id)
    if (aUnBail && !confirm(`${l.prenom} ${l.nom} a un ou plusieurs baux associés. Supprimer quand même ?`)) return
    if (!aUnBail && !confirm(`Supprimer ${l.prenom} ${l.nom} ?`)) return
    locataires.remove(l.id)
  }

  function statutInfo(v) {
    return STATUTS.find((s) => s.value === v) || STATUTS[3]
  }

  return (
    <div>
      <PageHeader
        title="Locataires"
        subtitle="Carnet des locataires actuels et anciens"
        action={<Button onClick={openNew}>+ Ajouter locataire</Button>}
      />

      {state.locataires.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Rechercher un locataire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {state.immeubles.length > 0 && (
            <Select value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)} className="max-w-xs">
              <option value="">Tous les immeubles</option>
              {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
            </Select>
          )}
          <Select value={filtrePaiement} onChange={(e) => setFiltrePaiement(e.target.value)} className="max-w-xs">
            {FILTRES_PAIEMENT.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </div>
      )}

      {state.locataires.length === 0 ? (
        <EmptyState
          title="Aucun locataire pour le moment"
          subtitle="Ajoutez votre premier locataire pour démarrer le suivi."
          action={<Button className="mt-2" onClick={openNew}>Ajouter mon premier locataire</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => {
            const bien = state.biens.find((b) => b.id === l.bienId)
            const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
            const info = statutInfo(l.statut)
            const statutPaiement = paiementDuMois.get(l.id)
            const paiementInfo = statutPaiement ? statutPaiementInfo(statutPaiement) : null
            return (
              <Card key={l.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{l.prenom} {l.nom}</h3>
                    <p className="text-sm text-slate-500">{l.email || 'Pas d\'email'}</p>
                    <p className="text-sm text-slate-500">{l.telephone || 'Pas de téléphone'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone={info.tone}>{info.label}</Badge>
                    {paiementInfo && <Badge tone={paiementInfo.tone}>Ce mois : {paiementInfo.label}</Badge>}
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  <p>{bien ? bien.nom : <span className="text-slate-400">Aucun bien assigné</span>}</p>
                  {immeuble && <p className="text-slate-400">{immeuble.nom}</p>}
                  <p className="mt-1 text-slate-400">Entrée : {formatDate(l.dateEntree)}</p>
                  {l.notes && <p className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-500">{l.notes}</p>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setDossierId(l.id)}>Voir le dossier</Button>
                  <Button variant="ghost" onClick={() => openEdit(l)}>Modifier</Button>
                  <Button variant="danger" onClick={() => remove(l)}>Supprimer</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Modifier le locataire' : 'Ajouter un locataire'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-locataire">Enregistrer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-locataire" onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom">
                <Input required value={modal.values.prenom} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, prenom: e.target.value } }))} />
              </Field>
              <Field label="Nom">
                <Input required value={modal.values.nom} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, nom: e.target.value } }))} />
              </Field>
            </div>
            <Field label="Adresse e-mail">
              <Input type="email" value={modal.values.email} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, email: e.target.value } }))} />
            </Field>
            <Field label="Téléphone">
              <Input value={modal.values.telephone} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, telephone: e.target.value } }))} />
            </Field>
            <Field label="Bien occupé">
              <Select value={modal.values.bienId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, bienId: e.target.value } }))}>
                <option value="">— Aucun —</option>
                {state.biens.map((b) => {
                  const immeuble = state.immeubles.find((i) => i.id === b.immeubleId)
                  return <option key={b.id} value={b.id}>{immeuble ? `${immeuble.nom} — ${b.nom}` : b.nom}</option>
                })}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date d'entrée">
                <Input type="date" value={modal.values.dateEntree} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, dateEntree: e.target.value } }))} />
              </Field>
              <Field label="Statut">
                <Select value={modal.values.statut} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, statut: e.target.value } }))}>
                  {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Notes internes">
              <Textarea
                placeholder="Ex. : accord de paiement en 2 fois, difficulté financière temporaire..."
                value={modal.values.notes || ''}
                onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, notes: e.target.value } }))}
              />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
