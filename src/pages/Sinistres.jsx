import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { useCrudModal } from '../lib/useCrudModal.js'
import { useConfirm } from '../lib/confirm.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Textarea, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate, formatMontant } from '../lib/utils.js'

const TYPES = ['Dégât des eaux', 'Incendie', 'Vol / cambriolage', 'Vandalisme', 'Bris de vitre', 'Autre']

const STATUTS = [
  { value: 'en_cours', label: 'En cours', tone: 'amber' },
  { value: 'clos', label: 'Clos', tone: 'green' },
]

const emptySinistre = {
  immeubleId: '', bienId: '', type: TYPES[0], compagnieAssurance: '', numeroDossier: '',
  dateSinistre: '', description: '', statut: 'en_cours', montantEstime: '',
}

function coercerSinistre(values) {
  return { ...values, montantEstime: Number(values.montantEstime) || 0 }
}

export default function Sinistres() {
  const { state, sinistres, messages } = useStore()
  const confirm = useConfirm()
  const modal = useCrudModal(sinistres, emptySinistre, coercerSinistre)
  const [filtreImmeuble, setFiltreImmeuble] = useState('')
  const [notif, setNotif] = useState(null)

  async function remove(s) {
    if (await confirm(`Supprimer le dossier de sinistre "${s.type}" ?`, { danger: true })) sinistres.remove(s.id)
  }

  function notifierProprietaire(s) {
    const immeuble = state.immeubles.find((i) => i.id === s.immeubleId)
    const bien = state.biens.find((b) => b.id === s.bienId)
    if (!immeuble) return
    const texte = [
      `Objet : Sinistre — ${s.type} — ${immeuble.nom}`,
      '',
      `Bonjour${immeuble.proprietaireNom ? ` ${immeuble.proprietaireNom}` : ''},`,
      '',
      `Un sinistre "${s.type}" a été déclaré le ${formatDate(s.dateSinistre)} sur votre bien ${immeuble.nom}${bien ? ` (${bien.nom})` : ''}.`,
      s.description ? `Détails : ${s.description}` : '',
      s.numeroDossier ? `N° de dossier assurance : ${s.numeroDossier}` : '',
      `Montant estimé des dégâts : ${formatMontant(s.montantEstime)}.`,
      '',
      'Nous revenons vers vous dès que le dossier assurance évolue.',
      '',
      'Cordialement,',
    ].filter(Boolean).join('\n')
    messages.add({
      immeubleId: immeuble.id,
      destinataire: 'proprietaire',
      canal: 'email',
      sujet: `Sinistre — ${s.type} — ${immeuble.nom}`,
      contenu: texte,
      date: new Date().toISOString().slice(0, 10),
      sens: 'envoye',
    })
    setNotif({ immeuble, texte })
  }

  const biensDeImmeuble = state.biens.filter((b) => b.immeubleId === modal.modal?.values.immeubleId)
  const liste = state.sinistres.filter((s) => !filtreImmeuble || s.immeubleId === filtreImmeuble)

  function statutInfo(v) {
    return STATUTS.find((s) => s.value === v) || STATUTS[0]
  }

  return (
    <div>
      <PageHeader
        title="Sinistres & assurances"
        subtitle="Dossiers de sinistre suivis par immeuble"
        action={<Button onClick={() => modal.openNew()}>+ Déclarer un sinistre</Button>}
      />

      {state.immeubles.length > 0 && (
        <Select className="mb-4 max-w-xs" value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)}>
          <option value="">Tous les immeubles</option>
          {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
        </Select>
      )}

      {liste.length === 0 ? (
        <EmptyState title="Aucun dossier de sinistre" subtitle="Déclarez un sinistre pour en assurer le suivi." action={<Button className="mt-2" onClick={() => modal.openNew()}>Déclarer un sinistre</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Bien</th>
                  <th className="pb-2 pr-4">N° dossier</th>
                  <th className="pb-2 pr-4">Assurance</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Montant estimé</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {liste.map((s) => {
                  const immeuble = state.immeubles.find((i) => i.id === s.immeubleId)
                  const bien = state.biens.find((b) => b.id === s.bienId)
                  const info = statutInfo(s.statut)
                  return (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{s.type}</td>
                      <td className="py-2 pr-4 text-slate-600">{immeuble ? immeuble.nom : '—'}{bien ? ` — ${bien.nom}` : ''}</td>
                      <td className="py-2 pr-4 text-slate-600">{s.numeroDossier || '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{s.compagnieAssurance || '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatDate(s.dateSinistre)}</td>
                      <td className="py-2 pr-4 text-slate-600">{formatMontant(s.montantEstime)}</td>
                      <td className="py-2 pr-4"><Badge tone={info.tone}>{info.label}</Badge></td>
                      <td className="py-2 text-right">
                        <Button variant="secondary" onClick={() => notifierProprietaire(s)}>Notifier propriétaire</Button>
                        <Button variant="ghost" onClick={() => modal.openEdit(s)}>Modifier</Button>
                        <Button variant="danger" onClick={() => remove(s)}>Suppr.</Button>
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
        open={!!modal.modal}
        onClose={modal.close}
        title={modal.modal?.mode === 'edit' ? 'Modifier le sinistre' : 'Déclarer un sinistre'}
        footer={
          <>
            <Button variant="secondary" onClick={modal.close}>Annuler</Button>
            <Button type="submit" form="form-sinistre">Enregistrer</Button>
          </>
        }
      >
        {modal.modal && (
          <form id="form-sinistre" onSubmit={modal.save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type de sinistre">
                <Select value={modal.modal.values.type} onChange={modal.field('type')}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Statut">
                <Select value={modal.modal.values.statut} onChange={modal.field('statut')}>
                  {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Immeuble">
                <Select value={modal.modal.values.immeubleId} onChange={(e) => modal.setValues({ immeubleId: e.target.value, bienId: '' })}>
                  <option value="">— Aucun —</option>
                  {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
                </Select>
              </Field>
              <Field label="Bien concerné">
                <Select value={modal.modal.values.bienId} onChange={modal.field('bienId')}>
                  <option value="">— Aucun —</option>
                  {biensDeImmeuble.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Compagnie d'assurance">
                <Input value={modal.modal.values.compagnieAssurance} onChange={modal.field('compagnieAssurance')} />
              </Field>
              <Field label="N° de dossier">
                <Input value={modal.modal.values.numeroDossier} onChange={modal.field('numeroDossier')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date du sinistre">
                <Input type="date" value={modal.modal.values.dateSinistre} onChange={modal.field('dateSinistre')} />
              </Field>
              <Field label="Montant estimé (€)">
                <Input type="number" min="0" value={modal.modal.values.montantEstime} onChange={modal.field('montantEstime')} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={modal.modal.values.description} onChange={modal.field('description')} />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={!!notif}
        onClose={() => setNotif(null)}
        title={notif ? `Propriétaire notifié — ${notif.immeuble.nom}` : ''}
        footer={<Button onClick={() => setNotif(null)}>Fermer</Button>}
      >
        {notif && (
          <>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{notif.texte}</pre>
            <p className="mt-2 text-xs text-slate-400">
              {notif.immeuble.proprietaireEmail
                ? `Enregistré dans la messagerie propriétaire (${notif.immeuble.proprietaireEmail}).`
                : "Enregistré dans la messagerie propriétaire. Pensez à renseigner l'e-mail du propriétaire depuis la page Immeubles."}
            </p>
          </>
        )}
      </Modal>
    </div>
  )
}
