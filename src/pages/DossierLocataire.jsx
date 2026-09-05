import React, { useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, Button, Badge, Modal, Field, Input, Select, Textarea, EmptyState } from '../components/ui.jsx'
import { formatDate, formatMontant, labelMois, statutPaiementInfo } from '../lib/utils.js'
import { itemsAdminBail } from '../lib/taches.js'

const STATUTS_LOCATAIRE = {
  excellent_payeur: { label: 'Excellent payeur', tone: 'green' },
  bon_payeur: { label: 'Bon payeur', tone: 'blue' },
  mauvais_payeur: { label: 'Mauvais payeur', tone: 'red' },
  nouveau: { label: 'Nouveau', tone: 'slate' },
}

const TYPES_DOCUMENT = [
  { value: 'carte_identite', label: "Pièce d'identité" },
  { value: 'contrat_bail', label: 'Contrat de bail' },
  { value: 'assurance', label: 'Attestation assurance' },
  { value: 'autre', label: 'Autre document' },
]

const PIECES_DEFAUT = ['Entrée', 'Séjour', 'Cuisine', 'Chambre 1', 'Chambre 2', 'Salle de bain', 'WC']

const ETATS_PIECE = [
  { value: 'bon', label: 'Bon' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'mauvais', label: 'Mauvais' },
]

function emptyEtatDesLieux(bailId, type) {
  return {
    bailId,
    type,
    date: new Date().toISOString().slice(0, 10),
    pieces: PIECES_DEFAUT.map((nom) => ({ nom, etat: 'bon', commentaire: '' })),
    compteurs: { electricite: '', eau: '', gaz: '' },
    nombreCles: '',
    observations: '',
  }
}

function toneEtat(etat) {
  return etat === 'bon' ? 'green' : etat === 'moyen' ? 'amber' : 'red'
}

export default function DossierLocataire({ locataireId, onBack }) {
  const { state, locataires, documents, etatsDesLieux, messages, baux } = useStore()
  const fileInput = useRef(null)
  const [typeUpload, setTypeUpload] = useState('carte_identite')
  const [modalEdl, setModalEdl] = useState(null)
  const [apercuDocument, setApercuDocument] = useState(null)

  const locataire = state.locataires.find((l) => l.id === locataireId)
  const bien = locataire ? state.biens.find((b) => b.id === locataire.bienId) : null
  const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
  const bail = state.baux.find((b) => b.locataireId === locataireId && b.statut === 'actif')
  const docsLocataire = state.documents.filter((d) => d.locataireId === locataireId)
  const edlBail = bail ? state.etatsDesLieux.filter((e) => e.bailId === bail.id) : []
  const messagesLocataire = [...state.messages].filter((m) => m.locataireId === locataireId).sort((a, b) => new Date(b.date) - new Date(a.date))

  const paiementsRecents = useMemo(() => {
    if (!bail) return []
    return [...state.paiements]
      .filter((p) => p.bailId === bail.id)
      .sort((a, b) => (a.mois < b.mois ? 1 : -1))
      .slice(0, 6)
  }, [state.paiements, bail])

  if (!locataire) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack}>← Retour</Button>
        <EmptyState title="Locataire introuvable" subtitle="Ce locataire a peut-être été supprimé." />
      </div>
    )
  }

  const statutInfo = STATUTS_LOCATAIRE[locataire.statut] || STATUTS_LOCATAIRE.nouveau

  function importerDocument(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      documents.add({
        locataireId,
        bailId: bail?.id || null,
        type: typeUpload,
        nom: file.name,
        mime: file.type,
        dataUrl: reader.result,
        dateAjout: new Date().toISOString().slice(0, 10),
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function supprimerDocument(doc) {
    if (confirm(`Supprimer le document "${doc.nom}" ?`)) documents.remove(doc.id)
  }

  function ouvrirNouvelEdl(type) {
    if (!bail) return
    setModalEdl({ mode: 'create', values: emptyEtatDesLieux(bail.id, type) })
  }
  function ouvrirEdl(edl) {
    setModalEdl({ mode: 'view', id: edl.id, values: edl })
  }
  function sauverEdl(e) {
    e.preventDefault()
    const { mode, id, values } = modalEdl
    const payload = { ...values, nombreCles: Number(values.nombreCles) || 0 }
    if (mode === 'create') etatsDesLieux.add(payload)
    else etatsDesLieux.update(id, payload)
    setModalEdl(null)
  }
  function supprimerEdl(edl) {
    if (confirm("Supprimer cet état des lieux ?")) etatsDesLieux.remove(edl.id)
  }

  function marquerFaitAujourdhui(cle) {
    if (!bail) return
    baux.update(bail.id, { [cle]: new Date().toISOString().slice(0, 10) })
  }

  const itemsAdmin = bail ? itemsAdminBail(bail) : []

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-800">
        ← Retour aux locataires
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{locataire.prenom} {locataire.nom}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {bien ? bien.nom : 'Bien inconnu'}{immeuble ? ` — ${immeuble.nom}, ${immeuble.adresse}, ${immeuble.codePostal} ${immeuble.ville}` : ''}
          </p>
        </div>
        <Badge tone={statutInfo.tone}>{statutInfo.label}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Coordonnées</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">E-mail</dt><dd className="text-slate-800">{locataire.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Téléphone</dt><dd className="text-slate-800">{locataire.telephone || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Entrée</dt><dd className="text-slate-800">{formatDate(locataire.dateEntree)}</dd></div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Bail actif</h2>
          {bail ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Période</dt><dd className="text-slate-800">{formatDate(bail.dateDebut)} → {formatDate(bail.dateFin)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Loyer + charges</dt><dd className="font-medium text-slate-900">{formatMontant(Number(bail.loyer) + Number(bail.charges))}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Dépôt garantie</dt><dd className="text-slate-800">{formatMontant(bail.depotGarantie)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Fréquence</dt><dd className="text-slate-800 capitalize">{bail.frequence || 'mensuel'}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Aucun bail actif pour ce locataire.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Historique des paiements</h2>
          {paiementsRecents.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
          ) : (
            <div className="space-y-1.5">
              {paiementsRecents.map((p) => {
                const info = statutPaiementInfo(p.statut)
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{labelMois(p.mois)}</span>
                    <Badge tone={info.tone}>{info.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {bail && (
        <Card className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Suivi administratif du dossier</h2>
          <div className="divide-y divide-slate-100">
            {itemsAdmin.map((item) => (
              <div key={item.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${item.ok ? 'bg-emerald-500' : 'bg-red-500'}`} aria-hidden />
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-xs text-slate-400">
                    {item.valeur ? `Dernière fois : ${formatDate(item.valeur)}` : 'Jamais renseigné'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.ok ? <Badge tone="green">À jour</Badge> : <Badge tone="red">À faire</Badge>}
                  <Button variant="ghost" onClick={() => marquerFaitAujourdhui(item.key)}>Marquer fait</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Documents</h2>
          <div className="flex items-center gap-2">
            <Select value={typeUpload} onChange={(e) => setTypeUpload(e.target.value)} className="max-w-[10rem] text-xs">
              {TYPES_DOCUMENT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Button variant="secondary" onClick={() => fileInput.current?.click()}>+ Ajouter</Button>
            <input ref={fileInput} type="file" accept="image/*,application/pdf" className="hidden" onChange={importerDocument} />
          </div>
        </div>
        {docsLocataire.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun document : pièce d'identité, contrat de bail signé, attestation d'assurance...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {docsLocataire.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-slate-200 p-2">
                <button onClick={() => setApercuDocument(doc)} className="block w-full">
                  {doc.mime?.startsWith('image/') ? (
                    <img src={doc.dataUrl} alt={doc.nom} className="h-24 w-full rounded object-cover" />
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded bg-slate-100 text-3xl">🧾</div>
                  )}
                </button>
                <p className="mt-1 truncate text-xs font-medium text-slate-700" title={doc.nom}>{doc.nom}</p>
                <p className="text-[11px] text-slate-400">{TYPES_DOCUMENT.find((t) => t.value === doc.type)?.label}</p>
                <Button variant="danger" className="mt-1 w-full !py-1 text-xs" onClick={() => supprimerDocument(doc)}>Supprimer</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">États des lieux</h2>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!bail} onClick={() => ouvrirNouvelEdl('entree')}>+ État d'entrée</Button>
            <Button variant="secondary" disabled={!bail} onClick={() => ouvrirNouvelEdl('sortie')}>+ État de sortie</Button>
          </div>
        </div>
        {!bail ? (
          <p className="text-sm text-slate-500">Un bail actif est nécessaire pour créer un état des lieux.</p>
        ) : edlBail.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun état des lieux enregistré pour ce bail.</p>
        ) : (
          <div className="space-y-2">
            {edlBail.map((edl) => (
              <div key={edl.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div>
                  <span className="font-medium text-slate-800">{edl.type === 'entree' ? "État des lieux d'entrée" : 'État des lieux de sortie'}</span>
                  <span className="ml-2 text-sm text-slate-500">{formatDate(edl.date)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => ouvrirEdl(edl)}>Consulter</Button>
                  <Button variant="danger" onClick={() => supprimerEdl(edl)}>Suppr.</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Messagerie récente</h2>
        {messagesLocataire.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun message échangé avec ce locataire.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {messagesLocataire.slice(0, 3).map((m) => (
              <div key={m.id} className="py-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{m.sujet}</p>
                  <Badge tone={m.sens === 'envoye' ? 'blue' : 'slate'}>{m.sens === 'envoye' ? 'Envoyé' : 'Reçu'}</Badge>
                </div>
                <p className="text-xs text-slate-400">{formatDate(m.date)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!apercuDocument} onClose={() => setApercuDocument(null)} title={apercuDocument?.nom} footer={<Button onClick={() => setApercuDocument(null)}>Fermer</Button>}>
        {apercuDocument?.mime?.startsWith('image/') ? (
          <img src={apercuDocument.dataUrl} alt={apercuDocument.nom} className="w-full rounded-lg" />
        ) : (
          <a href={apercuDocument?.dataUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">Ouvrir le document</a>
        )}
      </Modal>

      <Modal
        open={!!modalEdl}
        onClose={() => setModalEdl(null)}
        title={modalEdl?.values?.type === 'sortie' ? 'État des lieux de sortie' : "État des lieux d'entrée"}
        footer={
          modalEdl?.mode === 'create' ? (
            <>
              <Button variant="secondary" onClick={() => setModalEdl(null)}>Annuler</Button>
              <Button type="submit" form="form-edl">Enregistrer</Button>
            </>
          ) : (
            <Button onClick={() => setModalEdl(null)}>Fermer</Button>
          )
        }
      >
        {modalEdl && modalEdl.mode === 'create' && (
          <form id="form-edl" onSubmit={sauverEdl} className="space-y-4">
            <Field label="Date">
              <Input type="date" value={modalEdl.values.date} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, date: e.target.value } }))} />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">État par pièce</p>
              <div className="space-y-2">
                {modalEdl.values.pieces.map((p, i) => (
                  <div key={p.nom} className="grid grid-cols-3 gap-2">
                    <span className="self-center text-sm text-slate-600">{p.nom}</span>
                    <Select
                      value={p.etat}
                      onChange={(e) => setModalEdl((m) => {
                        const pieces = [...m.values.pieces]
                        pieces[i] = { ...pieces[i], etat: e.target.value }
                        return { ...m, values: { ...m.values, pieces } }
                      })}
                    >
                      {ETATS_PIECE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Select>
                    <Input
                      placeholder="Commentaire"
                      value={p.commentaire}
                      onChange={(e) => setModalEdl((m) => {
                        const pieces = [...m.values.pieces]
                        pieces[i] = { ...pieces[i], commentaire: e.target.value }
                        return { ...m, values: { ...m.values, pieces } }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Élec. (index)">
                <Input value={modalEdl.values.compteurs.electricite} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, compteurs: { ...m.values.compteurs, electricite: e.target.value } } }))} />
              </Field>
              <Field label="Eau (index)">
                <Input value={modalEdl.values.compteurs.eau} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, compteurs: { ...m.values.compteurs, eau: e.target.value } } }))} />
              </Field>
              <Field label="Gaz (index)">
                <Input value={modalEdl.values.compteurs.gaz} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, compteurs: { ...m.values.compteurs, gaz: e.target.value } } }))} />
              </Field>
              <Field label="Nb de clés">
                <Input type="number" min="0" value={modalEdl.values.nombreCles} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, nombreCles: e.target.value } }))} />
              </Field>
            </div>
            <Field label="Observations générales">
              <Textarea value={modalEdl.values.observations} onChange={(e) => setModalEdl((m) => ({ ...m, values: { ...m.values, observations: e.target.value } }))} />
            </Field>
          </form>
        )}

        {modalEdl && modalEdl.mode === 'view' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Date : {formatDate(modalEdl.values.date)}</p>
            <div className="space-y-1.5">
              {modalEdl.values.pieces.map((p) => (
                <div key={p.nom} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{p.nom}{p.commentaire ? ` — ${p.commentaire}` : ''}</span>
                  <Badge tone={toneEtat(p.etat)}>{ETATS_PIECE.find((s) => s.value === p.etat)?.label}</Badge>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm text-slate-600">
              <p>Élec. : {modalEdl.values.compteurs?.electricite || '—'}</p>
              <p>Eau : {modalEdl.values.compteurs?.eau || '—'}</p>
              <p>Gaz : {modalEdl.values.compteurs?.gaz || '—'}</p>
              <p>Clés : {modalEdl.values.nombreCles || 0}</p>
            </div>
            {modalEdl.values.observations && <p className="text-sm text-slate-600">{modalEdl.values.observations}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
