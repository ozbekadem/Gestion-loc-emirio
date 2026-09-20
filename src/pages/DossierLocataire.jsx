import React, { useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Button, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate, labelMois, moisCourant, statutPaiementInfo, statutLocataireInfo, texteRappelLoyer } from '../lib/utils.js'
import { itemsAdminBail } from '../lib/taches.js'
import { useConfirm } from '../lib/confirm.jsx'
import { emptyEtatDesLieux } from './dossier-locataire/constants.js'
import CarteCoordonnees from './dossier-locataire/CarteCoordonnees.jsx'
import CarteBailActif from './dossier-locataire/CarteBailActif.jsx'
import CarteHistoriquePaiements from './dossier-locataire/CarteHistoriquePaiements.jsx'
import CarteSuiviAdministratif from './dossier-locataire/CarteSuiviAdministratif.jsx'
import CarteDocuments from './dossier-locataire/CarteDocuments.jsx'
import CarteTravaux from './dossier-locataire/CarteTravaux.jsx'
import CarteEtatsDesLieux from './dossier-locataire/CarteEtatsDesLieux.jsx'
import CarteMessagerie from './dossier-locataire/CarteMessagerie.jsx'
import ModalEtatDesLieux from './dossier-locataire/ModalEtatDesLieux.jsx'
import ModalApercuDocument from './dossier-locataire/ModalApercuDocument.jsx'
import ModalRelance from './dossier-locataire/ModalRelance.jsx'

export default function DossierLocataire({ locataireId, onBack }) {
  const { state, locataires, documents, etatsDesLieux, messages, baux } = useStore()
  const confirm = useConfirm()
  const fileInput = useRef(null)
  const [typeUpload, setTypeUpload] = useState('carte_identite')
  const [modalEdl, setModalEdl] = useState(null)
  const [apercuDocument, setApercuDocument] = useState(null)
  const [rappel, setRappel] = useState(null)

  const locataire = state.locataires.find((l) => l.id === locataireId)
  const bien = locataire ? state.biens.find((b) => b.id === locataire.bienId) : null
  const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
  const bail = state.baux.find((b) => b.locataireId === locataireId && b.statut === 'actif')
  const docsLocataire = state.documents.filter((d) => d.locataireId === locataireId)
  const edlBail = bail ? state.etatsDesLieux.filter((e) => e.bailId === bail.id) : []
  const travauxBien = bien ? state.travaux.filter((t) => t.bienId === bien.id) : []
  const messagesLocataire = state.messages.filter((m) => m.locataireId === locataireId).sort((a, b) => new Date(b.date) - new Date(a.date))

  const paiementMoisCourant = useMemo(() => {
    if (!bail) return null
    return state.paiements.find((p) => p.bailId === bail.id && p.mois === moisCourant()) || null
  }, [state.paiements, bail])

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

  const statutInfo = statutLocataireInfo(locataire.statut)

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

  async function supprimerDocument(doc) {
    if (await confirm(`Supprimer le document "${doc.nom}" ?`, { danger: true })) documents.remove(doc.id)
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
  async function supprimerEdl(edl) {
    if (await confirm("Supprimer cet état des lieux ?", { danger: true })) etatsDesLieux.remove(edl.id)
  }

  function marquerFaitAujourdhui(cle) {
    if (!bail) return
    baux.update(bail.id, { [cle]: new Date().toISOString().slice(0, 10) })
  }

  function enregistrerNotes(valeur) {
    locataires.update(locataireId, { notes: valeur })
  }

  function relancer() {
    if (!bail) return
    const montantAttendu = Number(bail.loyer) + Number(bail.charges)
    const montantDu = montantAttendu - Number(paiementMoisCourant?.montantPaye || 0)
    const texte = texteRappelLoyer(locataire, montantDu, labelMois(moisCourant()))
    messages.add({
      locataireId,
      destinataire: 'locataire',
      canal: 'email',
      sujet: `Rappel de loyer — ${labelMois(moisCourant())}`,
      contenu: texte,
      date: new Date().toISOString().slice(0, 10),
      sens: 'envoye',
    })
    setRappel(texte)
  }

  function apercuPhotoTravail(travail, photo) {
    setApercuDocument({ nom: `${travail.titre} (${photo.moment === 'avant' ? 'avant' : 'après'})`, mime: 'image/*', dataUrl: photo.dataUrl })
  }

  const itemsAdmin = bail ? itemsAdminBail(bail) : []
  const statutMoisCourant = bail ? statutPaiementInfo(paiementMoisCourant?.statut || 'attendu') : null
  const meriteRelance = bail && (paiementMoisCourant?.statut === 'retard' || paiementMoisCourant?.statut === 'partiel')

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
        <CarteCoordonnees locataire={locataire} onNotesChange={enregistrerNotes} />
        <CarteBailActif bail={bail} />
        <CarteHistoriquePaiements
          statutMoisCourant={statutMoisCourant}
          paiementsRecents={paiementsRecents}
          meriteRelance={meriteRelance}
          onRelancer={relancer}
        />
      </div>

      <CarteSuiviAdministratif bail={bail} itemsAdmin={itemsAdmin} onMarquerFait={marquerFaitAujourdhui} />

      <CarteDocuments
        docs={docsLocataire}
        typeUpload={typeUpload}
        setTypeUpload={setTypeUpload}
        fileInput={fileInput}
        onImporter={importerDocument}
        onSupprimer={supprimerDocument}
        onApercu={setApercuDocument}
      />

      <CarteTravaux travaux={travauxBien} prestataires={state.prestataires} onApercuPhoto={apercuPhotoTravail} />

      <CarteEtatsDesLieux
        bail={bail}
        etatsDesLieux={edlBail}
        onNouveau={ouvrirNouvelEdl}
        onConsulter={ouvrirEdl}
        onSupprimer={supprimerEdl}
      />

      <CarteMessagerie messages={messagesLocataire} />

      <ModalRelance rappel={rappel} onClose={() => setRappel(null)} />
      <ModalApercuDocument document={apercuDocument} onClose={() => setApercuDocument(null)} />
      <ModalEtatDesLieux modalEdl={modalEdl} setModalEdl={setModalEdl} onSave={sauverEdl} />
    </div>
  )
}
