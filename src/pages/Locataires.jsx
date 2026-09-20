import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { useCrudModal } from '../lib/useCrudModal.js'
import { useConfirm } from '../lib/confirm.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Textarea, EmptyState, Badge } from '../components/ui.jsx'
import { formatDate, moisCourant, statutPaiementInfo, STATUTS_LOCATAIRE, statutLocataireInfo } from '../lib/utils.js'
import DossierLocataire from './DossierLocataire.jsx'

const FILTRES_PAIEMENT = [
  { value: '', label: 'Tous les paiements' },
  { value: 'retard', label: 'En retard ce mois' },
  { value: 'partiel', label: 'Partiel ce mois' },
  { value: 'paye', label: 'Payé ce mois' },
]

const emptyLocataire = { nom: '', prenom: '', email: '', telephone: '', bienId: '', dateEntree: '', statut: 'nouveau', notes: '' }

export default function Locataires() {
  const { state, locataires } = useStore()
  const confirm = useConfirm()
  const locataireModal = useCrudModal(locataires, emptyLocataire)
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

  async function remove(l) {
    const aUnBail = state.baux.some((b) => b.locataireId === l.id)
    const message = aUnBail
      ? `${l.prenom} ${l.nom} a un ou plusieurs baux associés. Supprimer quand même ?`
      : `Supprimer ${l.prenom} ${l.nom} ?`
    if (await confirm(message, { danger: true })) locataires.remove(l.id)
  }

  return (
    <div>
      <PageHeader
        title="Locataires"
        subtitle="Carnet des locataires actuels et anciens"
        action={<Button onClick={() => locataireModal.openNew()}>+ Ajouter locataire</Button>}
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
          action={<Button className="mt-2" onClick={() => locataireModal.openNew()}>Ajouter mon premier locataire</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => {
            const bien = state.biens.find((b) => b.id === l.bienId)
            const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
            const info = statutLocataireInfo(l.statut)
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
                  <Button variant="ghost" onClick={() => locataireModal.openEdit(l)}>Modifier</Button>
                  <Button variant="danger" onClick={() => remove(l)}>Supprimer</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!locataireModal.modal}
        onClose={locataireModal.close}
        title={locataireModal.modal?.mode === 'edit' ? 'Modifier le locataire' : 'Ajouter un locataire'}
        footer={
          <>
            <Button variant="secondary" onClick={locataireModal.close}>Annuler</Button>
            <Button type="submit" form="form-locataire">Enregistrer</Button>
          </>
        }
      >
        {locataireModal.modal && (
          <form id="form-locataire" onSubmit={locataireModal.save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom">
                <Input required value={locataireModal.modal.values.prenom} onChange={locataireModal.field('prenom')} />
              </Field>
              <Field label="Nom">
                <Input required value={locataireModal.modal.values.nom} onChange={locataireModal.field('nom')} />
              </Field>
            </div>
            <Field label="Adresse e-mail">
              <Input type="email" value={locataireModal.modal.values.email} onChange={locataireModal.field('email')} />
            </Field>
            <Field label="Téléphone">
              <Input value={locataireModal.modal.values.telephone} onChange={locataireModal.field('telephone')} />
            </Field>
            <Field label="Bien occupé">
              <Select value={locataireModal.modal.values.bienId} onChange={locataireModal.field('bienId')}>
                <option value="">— Aucun —</option>
                {state.biens.map((b) => {
                  const immeuble = state.immeubles.find((i) => i.id === b.immeubleId)
                  return <option key={b.id} value={b.id}>{immeuble ? `${immeuble.nom} — ${b.nom}` : b.nom}</option>
                })}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date d'entrée">
                <Input type="date" value={locataireModal.modal.values.dateEntree} onChange={locataireModal.field('dateEntree')} />
              </Field>
              <Field label="Statut">
                <Select value={locataireModal.modal.values.statut} onChange={locataireModal.field('statut')}>
                  {STATUTS_LOCATAIRE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Notes internes">
              <Textarea
                placeholder="Ex. : accord de paiement en 2 fois, difficulté financière temporaire..."
                value={locataireModal.modal.values.notes || ''}
                onChange={locataireModal.field('notes')}
              />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
