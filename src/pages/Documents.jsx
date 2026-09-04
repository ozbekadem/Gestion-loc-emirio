import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Field, Select, EmptyState } from '../components/ui.jsx'
import { formatDate, formatMontant } from '../lib/utils.js'

const TYPES_DOCUMENT = [
  { value: 'attestation_loyer', label: 'Attestation de loyer' },
  { value: 'quittance', label: 'Quittance de loyer' },
]

function genererTexte(type, { locataire, bail, bien, immeuble }) {
  const date = formatDate(new Date().toISOString())
  const adresseBien = immeuble ? `${immeuble.adresse}, ${immeuble.codePostal} ${immeuble.ville}` : '—'
  if (type === 'quittance') {
    return [
      'QUITTANCE DE LOYER',
      '',
      `Émise le ${date}`,
      '',
      `Je soussigné(e) propriétaire du bien situé ${adresseBien}${bien ? ` (${bien.nom})` : ''},`,
      `certifie avoir reçu de ${locataire.prenom} ${locataire.nom}`,
      `la somme de ${formatMontant(Number(bail?.loyer || 0) + Number(bail?.charges || 0))}`,
      'au titre du loyer et des charges,',
      "et lui en donne quittance, sous réserve de tous mes droits.",
      '',
      'Le bailleur',
    ].join('\n')
  }
  return [
    'ATTESTATION DE LOYER',
    '',
    `Émise le ${date}`,
    '',
    `Je soussigné(e) propriétaire, atteste que ${locataire.prenom} ${locataire.nom}`,
    `est locataire du bien situé ${adresseBien}${bien ? ` (${bien.nom})` : ''}`,
    `depuis le ${formatDate(locataire.dateEntree)},`,
    `pour un loyer mensuel de ${formatMontant(Number(bail?.loyer || 0))} hors charges${bail?.charges ? ` (charges : ${formatMontant(bail.charges)})` : ''}.`,
    '',
    'Cette attestation est délivrée pour servir et valoir ce que de droit.',
    '',
    'Le bailleur',
  ].join('\n')
}

export default function Documents() {
  const { state } = useStore()
  const [type, setType] = useState(TYPES_DOCUMENT[0].value)
  const [locataireId, setLocataireId] = useState('')

  const locataire = state.locataires.find((l) => l.id === locataireId)
  const bail = state.baux.find((b) => b.locataireId === locataireId && b.statut === 'actif')
  const bien = locataire ? state.biens.find((b) => b.id === locataire.bienId) : null
  const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null

  const texte = useMemo(() => {
    if (!locataire) return ''
    return genererTexte(type, { locataire, bail, bien, immeuble })
  }, [type, locataire, bail, bien, immeuble])

  function telecharger() {
    const blob = new Blob([texte], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-${locataire.nom}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader title="Documents" subtitle="Attestations et quittances de loyer" />

      {state.locataires.length === 0 ? (
        <EmptyState title="Aucun locataire disponible" subtitle="Ajoutez un locataire pour générer un document." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <div className="space-y-4">
              <Field label="Type de document">
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPES_DOCUMENT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="Locataire">
                <Select value={locataireId} onChange={(e) => setLocataireId(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {state.locataires.map((l) => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
                </Select>
              </Field>
              <Button className="w-full" disabled={!locataire} onClick={telecharger}>Télécharger (.txt)</Button>
              <Button className="w-full" variant="secondary" disabled={!locataire} onClick={() => window.print()}>Imprimer</Button>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {locataire ? (
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{texte}</pre>
            ) : (
              <p className="text-sm text-slate-500">Sélectionnez un locataire pour prévisualiser le document.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
