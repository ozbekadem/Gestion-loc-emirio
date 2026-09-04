import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Badge, EmptyState } from '../components/ui.jsx'
import { formatMontant, labelMois } from '../lib/utils.js'

function shiftMois(moisKey, delta) {
  const [annee, mois] = moisKey.split('-').map(Number)
  const d = new Date(annee, mois - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function moisCourantKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function Paiements() {
  const { state, paiements } = useStore()
  const [mois, setMois] = useState(moisCourantKey())
  const [modal, setModal] = useState(null)

  const bauxActifs = state.baux.filter((b) => b.statut === 'actif')

  const lignes = useMemo(() => {
    return bauxActifs.map((b) => {
      const loc = state.locataires.find((l) => l.id === b.locataireId)
      const bien = state.biens.find((x) => x.id === b.bienId)
      const paiement = state.paiements.find((p) => p.bailId === b.id && p.mois === mois)
      const montantAttendu = Number(b.loyer) + Number(b.charges)
      return { bail: b, loc, bien, paiement, montantAttendu }
    })
  }, [bauxActifs, state.locataires, state.biens, state.paiements, mois])

  const totalAttendu = lignes.reduce((s, l) => s + l.montantAttendu, 0)
  const totalPaye = lignes.reduce((s, l) => s + (l.paiement?.statut === 'paye' ? Number(l.paiement.montantPaye) : 0), 0)

  function openMarquerPaye(ligne) {
    setModal({
      bailId: ligne.bail.id,
      paiementId: ligne.paiement?.id,
      montantPaye: ligne.paiement?.montantPaye ?? ligne.montantAttendu,
      datePaiement: ligne.paiement?.datePaiement ?? new Date().toISOString().slice(0, 10),
    })
  }

  function save(e) {
    e.preventDefault()
    const payload = {
      bailId: modal.bailId,
      mois,
      montantAttendu: lignes.find((l) => l.bail.id === modal.bailId)?.montantAttendu ?? 0,
      montantPaye: Number(modal.montantPaye) || 0,
      datePaiement: modal.datePaiement,
      statut: 'paye',
    }
    if (modal.paiementId) paiements.update(modal.paiementId, payload)
    else paiements.add(payload)
    setModal(null)
  }

  function annulerPaiement(ligne) {
    if (ligne.paiement && confirm('Annuler ce paiement ?')) paiements.remove(ligne.paiement.id)
  }

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle="Suivi des loyers encaissés mois par mois"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setMois((m) => shiftMois(m, -1))}>←</Button>
            <span className="min-w-[10rem] text-center font-medium text-slate-700">{labelMois(mois)}</span>
            <Button variant="secondary" onClick={() => setMois((m) => shiftMois(m, 1))}>→</Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-slate-500">Attendu ce mois</p><p className="mt-1 text-xl font-bold text-slate-900">{formatMontant(totalAttendu)}</p></Card>
        <Card><p className="text-sm text-slate-500">Encaissé ce mois</p><p className="mt-1 text-xl font-bold text-emerald-600">{formatMontant(totalPaye)}</p></Card>
        <Card><p className="text-sm text-slate-500">Restant dû</p><p className="mt-1 text-xl font-bold text-red-600">{formatMontant(totalAttendu - totalPaye)}</p></Card>
      </div>

      {lignes.length === 0 ? (
        <EmptyState title="Aucun encaissement" subtitle="Aucun bail actif pour le moment." />
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
                {lignes.map((l) => (
                  <tr key={l.bail.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{l.loc ? `${l.loc.prenom} ${l.loc.nom}` : '—'}</td>
                    <td className="py-2 pr-4 text-slate-600">{l.bien ? l.bien.nom : '—'}</td>
                    <td className="py-2 pr-4 text-slate-600">{formatMontant(l.montantAttendu)}</td>
                    <td className="py-2 pr-4">
                      {l.paiement?.statut === 'paye' ? (
                        <Badge tone="green">Payé — {formatMontant(l.paiement.montantPaye)}</Badge>
                      ) : (
                        <Badge tone="amber">Attendu</Badge>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {l.paiement?.statut === 'paye' ? (
                        <>
                          <Button variant="ghost" onClick={() => openMarquerPaye(l)}>Modifier</Button>
                          <Button variant="danger" onClick={() => annulerPaiement(l)}>Annuler</Button>
                        </>
                      ) : (
                        <Button variant="secondary" onClick={() => openMarquerPaye(l)}>Marquer payé</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
            <Field label="Montant payé (€)">
              <Input type="number" min="0" required value={modal.montantPaye} onChange={(e) => setModal((m) => ({ ...m, montantPaye: e.target.value }))} />
            </Field>
            <Field label="Date de paiement">
              <Input type="date" required value={modal.datePaiement} onChange={(e) => setModal((m) => ({ ...m, datePaiement: e.target.value }))} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
