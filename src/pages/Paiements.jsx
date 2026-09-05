import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Badge, EmptyState } from '../components/ui.jsx'
import GrillePaiements from '../components/GrillePaiements.jsx'
import { formatMontant, labelMois, statutPaiementInfo } from '../lib/utils.js'

function shiftMois(moisKey, delta) {
  const [annee, mois] = moisKey.split('-').map(Number)
  const d = new Date(annee, mois - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function moisCourantKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function texteRappel(loc, montant, moisLabel) {
  return [
    `Objet : Rappel de loyer — ${moisLabel}`,
    '',
    `Bonjour ${loc.prenom},`,
    '',
    `Nous n'avons pas encore reçu le paiement de votre loyer de ${moisLabel}, d'un montant de ${formatMontant(montant)}.`,
    "Merci de bien vouloir régulariser cette situation dans les meilleurs délais.",
    '',
    "N'hésitez pas à nous contacter si un problème empêche ce paiement.",
    '',
    'Cordialement,',
  ].join('\n')
}

export default function Paiements() {
  const { state, paiements, messages } = useStore()
  const [onglet, setOnglet] = useState('mois')
  const [mois, setMois] = useState(moisCourantKey())
  const [modal, setModal] = useState(null)
  const [rappel, setRappel] = useState(null)
  const [filtreImmeuble, setFiltreImmeuble] = useState('')
  const [recherche, setRecherche] = useState('')

  const bauxActifs = state.baux.filter((b) => b.statut === 'actif')

  const toutesLesLignes = useMemo(() => {
    return bauxActifs.map((b) => {
      const loc = state.locataires.find((l) => l.id === b.locataireId)
      const bien = state.biens.find((x) => x.id === b.bienId)
      const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
      const paiement = state.paiements.find((p) => p.bailId === b.id && p.mois === mois)
      const montantAttendu = Number(b.loyer) + Number(b.charges)
      return { bail: b, loc, bien, immeuble, paiement, montantAttendu }
    })
  }, [bauxActifs, state.locataires, state.biens, state.immeubles, state.paiements, mois])

  const lignes = toutesLesLignes.filter((l) => {
    const matchImmeuble = !filtreImmeuble || l.immeuble?.id === filtreImmeuble
    const matchRecherche = !recherche || `${l.loc?.prenom} ${l.loc?.nom}`.toLowerCase().includes(recherche.toLowerCase())
    return matchImmeuble && matchRecherche
  })

  const totalAttendu = toutesLesLignes.reduce((s, l) => s + l.montantAttendu, 0)
  const totalPaye = toutesLesLignes.reduce((s, l) => s + (l.paiement?.statut === 'paye' || l.paiement?.statut === 'partiel' ? Number(l.paiement.montantPaye) : 0), 0)

  function openMarquerPaye(ligne) {
    setModal({
      bailId: ligne.bail.id,
      paiementId: ligne.paiement?.id,
      montantAttendu: ligne.montantAttendu,
      montantPaye: ligne.paiement?.montantPaye ?? ligne.montantAttendu,
      datePaiement: ligne.paiement?.datePaiement || new Date().toISOString().slice(0, 10),
    })
  }

  function save(e) {
    e.preventDefault()
    const montantPaye = Number(modal.montantPaye) || 0
    const statut = montantPaye <= 0 ? 'retard' : montantPaye < modal.montantAttendu ? 'partiel' : 'paye'
    const payload = {
      bailId: modal.bailId,
      mois,
      montantAttendu: modal.montantAttendu,
      montantPaye,
      datePaiement: statut === 'retard' ? '' : modal.datePaiement,
      statut,
    }
    if (modal.paiementId) paiements.update(modal.paiementId, payload)
    else paiements.add(payload)
    setModal(null)
  }

  function annulerPaiement(ligne) {
    if (ligne.paiement && confirm('Annuler ce paiement ?')) paiements.remove(ligne.paiement.id)
  }

  function relancer(ligne, soldeRestant) {
    if (!ligne.loc) return
    const montantDu = soldeRestant ?? ligne.montantAttendu
    const texte = texteRappel(ligne.loc, montantDu, labelMois(mois))
    messages.add({
      locataireId: ligne.loc.id,
      destinataire: 'locataire',
      canal: 'email',
      sujet: `Rappel de loyer — ${labelMois(mois)}`,
      contenu: texte,
      date: new Date().toISOString().slice(0, 10),
      sens: 'envoye',
    })
    setRappel({ loc: ligne.loc, texte })
  }

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle="Suivi des loyers encaissés"
        action={
          onglet === 'mois' ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setMois((m) => shiftMois(m, -1))}>←</Button>
              <span className="min-w-[10rem] text-center font-medium text-slate-700">{labelMois(mois)}</span>
              <Button variant="secondary" onClick={() => setMois((m) => shiftMois(m, 1))}>→</Button>
            </div>
          ) : null
        }
      />

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setOnglet('mois')}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${onglet === 'mois' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Vue mensuelle
        </button>
        <button
          onClick={() => setOnglet('grille')}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${onglet === 'grille' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Grille annuelle
        </button>
      </div>

      {onglet === 'grille' ? (
        <GrillePaiements />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card><p className="text-sm text-slate-500">Attendu ce mois</p><p className="mt-1 text-xl font-bold text-slate-900">{formatMontant(totalAttendu)}</p></Card>
            <Card><p className="text-sm text-slate-500">Encaissé ce mois</p><p className="mt-1 text-xl font-bold text-emerald-600">{formatMontant(totalPaye)}</p></Card>
            <Card><p className="text-sm text-slate-500">Restant dû</p><p className="mt-1 text-xl font-bold text-red-600">{formatMontant(totalAttendu - totalPaye)}</p></Card>
          </div>

          {toutesLesLignes.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              <Input
                placeholder="Rechercher un locataire..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="max-w-sm"
              />
              {state.immeubles.length > 0 && (
                <select
                  value={filtreImmeuble}
                  onChange={(e) => setFiltreImmeuble(e.target.value)}
                  className="max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Tous les immeubles</option>
                  {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
                </select>
              )}
            </div>
          )}

          {lignes.length === 0 ? (
            <EmptyState title="Aucun encaissement" subtitle="Aucun bail actif ne correspond à ce filtre." />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2 pr-4">Locataire</th>
                      <th className="pb-2 pr-4">Bien</th>
                      <th className="pb-2 pr-4">Montant attendu</th>
                      <th className="pb-2 pr-4">Statut</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l) => {
                      const info = statutPaiementInfo(l.paiement?.statut || 'attendu')
                      const soldeRestant = l.montantAttendu - Number(l.paiement?.montantPaye || 0)
                      const meriteRelance =
                        l.paiement?.statut === 'retard' ||
                        l.paiement?.statut === 'partiel' ||
                        (!l.paiement && mois < moisCourantKey())
                      return (
                        <tr key={l.bail.id} className="border-t border-slate-100">
                          <td className="py-2 pr-4 font-medium text-slate-800">{l.loc ? `${l.loc.prenom} ${l.loc.nom}` : '—'}</td>
                          <td className="py-2 pr-4 text-slate-600">
                            {l.bien ? l.bien.nom : '—'}
                            {l.immeuble && <span className="block text-xs text-slate-400">{l.immeuble.nom}</span>}
                          </td>
                          <td className="py-2 pr-4 text-slate-600">{formatMontant(l.montantAttendu)}</td>
                          <td className="py-2 pr-4">
                            <Badge tone={info.tone}>
                              {info.label}{l.paiement?.montantPaye ? ` — ${formatMontant(l.paiement.montantPaye)}` : ''}
                            </Badge>
                            {l.paiement?.statut === 'partiel' && (
                              <p className="mt-0.5 text-xs text-red-500">Solde dû : {formatMontant(soldeRestant)}</p>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            {l.paiement?.statut === 'paye' ? (
                              <>
                                <Button variant="ghost" onClick={() => openMarquerPaye(l)}>Modifier</Button>
                                <Button variant="danger" onClick={() => annulerPaiement(l)}>Annuler</Button>
                              </>
                            ) : (
                              <>
                                <Button variant="secondary" onClick={() => openMarquerPaye(l)}>
                                  {l.paiement?.statut === 'partiel' ? 'Compléter' : 'Marquer payé'}
                                </Button>
                                {meriteRelance && <Button variant="danger" onClick={() => relancer(l, soldeRestant)}>Relancer</Button>}
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title="Enregistrer le paiement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-paiement">Enregistrer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-paiement" onSubmit={save} className="space-y-4">
            <p className="text-sm text-slate-500">Montant attendu : <strong className="text-slate-800">{formatMontant(modal.montantAttendu)}</strong></p>
            <Field label="Montant payé (€)">
              <Input type="number" min="0" required value={modal.montantPaye} onChange={(e) => setModal((m) => ({ ...m, montantPaye: e.target.value }))} />
            </Field>
            {Number(modal.montantPaye) > 0 && (
              <Field label="Date de paiement">
                <Input type="date" required value={modal.datePaiement} onChange={(e) => setModal((m) => ({ ...m, datePaiement: e.target.value }))} />
              </Field>
            )}
            {(() => {
              const montantPaye = Number(modal.montantPaye) || 0
              const statutPrevu = montantPaye <= 0 ? 'retard' : montantPaye < modal.montantAttendu ? 'partiel' : 'paye'
              const info = statutPaiementInfo(statutPrevu)
              return (
                <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-600">Statut enregistré :</span>
                  <Badge tone={info.tone}>{info.label}</Badge>
                </div>
              )
            })()}
          </form>
        )}
      </Modal>

      <Modal
        open={!!rappel}
        onClose={() => setRappel(null)}
        title={rappel ? `Rappel envoyé à ${rappel.loc.prenom} ${rappel.loc.nom}` : ''}
        footer={<Button onClick={() => setRappel(null)}>Fermer</Button>}
      >
        {rappel && (
          <>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{rappel.texte}</pre>
            <p className="mt-2 text-xs text-slate-400">Ce rappel a été enregistré dans la messagerie du locataire.</p>
          </>
        )}
      </Modal>
    </div>
  )
}
