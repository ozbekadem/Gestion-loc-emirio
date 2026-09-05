import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Field, Select, EmptyState, Badge } from '../components/ui.jsx'
import { formatDate, formatMontant, labelMois } from '../lib/utils.js'

const TYPES_DOCUMENT = [
  { value: 'attestation_loyer', label: 'Attestation de loyer' },
  { value: 'quittance', label: 'Quittance de loyer' },
]

function genererAttestation({ locataire, bail, bien, immeuble }) {
  const date = formatDate(new Date().toISOString())
  const adresseBien = immeuble ? `${immeuble.adresse}, ${immeuble.codePostal} ${immeuble.ville}` : '—'
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

function genererQuittance({ locataire, bien, immeuble, paiement }) {
  const date = formatDate(new Date().toISOString())
  const adresseBien = immeuble ? `${immeuble.adresse}, ${immeuble.codePostal} ${immeuble.ville}` : '—'
  const estPartiel = paiement.statut === 'partiel'
  return [
    estPartiel ? 'QUITTANCE PARTIELLE DE LOYER' : 'QUITTANCE DE LOYER',
    '',
    `Émise le ${date}`,
    '',
    `Je soussigné(e) propriétaire du bien situé ${adresseBien}${bien ? ` (${bien.nom})` : ''},`,
    `certifie avoir reçu de ${locataire.prenom} ${locataire.nom}`,
    `la somme de ${formatMontant(paiement.montantPaye)}`,
    `au titre du loyer et des charges de ${labelMois(paiement.mois)}${paiement.datePaiement ? `, versée le ${formatDate(paiement.datePaiement)}` : ''},`,
    estPartiel
      ? `soit un paiement partiel sur un montant attendu de ${formatMontant(paiement.montantAttendu)} (solde restant dû : ${formatMontant(paiement.montantAttendu - paiement.montantPaye)}),`
      : 'soit l\'intégralité du montant dû pour cette période,',
    "et lui en donne quittance, sous réserve de tous mes droits.",
    '',
    'Le bailleur',
  ].join('\n')
}

export default function Documents() {
  const { state } = useStore()
  const [type, setType] = useState(TYPES_DOCUMENT[0].value)
  const [locataireId, setLocataireId] = useState('')
  const [paiementId, setPaiementId] = useState('')

  const locataire = state.locataires.find((l) => l.id === locataireId)
  const bail = state.baux.find((b) => b.locataireId === locataireId && b.statut === 'actif')
  const bien = locataire ? state.biens.find((b) => b.id === locataire.bienId) : null
  const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null

  const paiementsQuittables = useMemo(() => {
    if (!bail) return []
    return [...state.paiements]
      .filter((p) => p.bailId === bail.id && (p.statut === 'paye' || p.statut === 'partiel') && Number(p.montantPaye) > 0)
      .sort((a, b) => (a.mois < b.mois ? 1 : -1))
  }, [state.paiements, bail])

  const paiementSelectionne = paiementsQuittables.find((p) => p.id === paiementId) || paiementsQuittables[0] || null

  const texte = useMemo(() => {
    if (!locataire) return ''
    if (type === 'attestation_loyer') return genererAttestation({ locataire, bail, bien, immeuble })
    if (!paiementSelectionne) return ''
    return genererQuittance({ locataire, bien, immeuble, paiement: paiementSelectionne })
  }, [type, locataire, bail, bien, immeuble, paiementSelectionne])

  const peutGenerer = type === 'attestation_loyer' ? !!locataire : !!locataire && !!paiementSelectionne

  function telecharger() {
    const blob = new Blob([texte], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-${locataire.nom}${paiementSelectionne ? `-${paiementSelectionne.mois}` : ''}.txt`
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
                <Select value={type} onChange={(e) => { setType(e.target.value); setPaiementId('') }}>
                  {TYPES_DOCUMENT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="Locataire">
                <Select value={locataireId} onChange={(e) => { setLocataireId(e.target.value); setPaiementId('') }}>
                  <option value="">— Choisir —</option>
                  {state.locataires.map((l) => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
                </Select>
              </Field>
              {type === 'quittance' && locataire && (
                <Field label="Mois payé">
                  {paiementsQuittables.length === 0 ? (
                    <p className="text-xs text-amber-600">Aucun paiement encaissé pour ce locataire : impossible d'émettre une quittance.</p>
                  ) : (
                    <Select value={paiementSelectionne?.id || ''} onChange={(e) => setPaiementId(e.target.value)}>
                      {paiementsQuittables.map((p) => (
                        <option key={p.id} value={p.id}>
                          {labelMois(p.mois)} — {formatMontant(p.montantPaye)}{p.statut === 'partiel' ? ' (partiel)' : ''}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              )}
              {type === 'quittance' && paiementSelectionne?.statut === 'partiel' && (
                <Badge tone="amber">Paiement partiel — la quittance le précisera</Badge>
              )}
              <Button className="w-full" disabled={!peutGenerer} onClick={telecharger}>Télécharger (.txt)</Button>
              <Button className="w-full" variant="secondary" disabled={!peutGenerer} onClick={() => window.print()}>Imprimer</Button>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {!locataire ? (
              <p className="text-sm text-slate-500">Sélectionnez un locataire pour prévisualiser le document.</p>
            ) : !peutGenerer ? (
              <p className="text-sm text-slate-500">Aucun paiement disponible pour générer une quittance pour ce locataire.</p>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{texte}</pre>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
