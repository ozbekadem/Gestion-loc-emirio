import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Field, Input, Select, Textarea, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate } from '../lib/utils.js'

const CANAUX = [
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'courrier', label: 'Courrier' },
  { value: 'autre', label: 'Autre' },
]

const emptyMessage = { canal: 'email', sujet: '', contenu: '', sens: 'envoye' }

export default function Messagerie() {
  const { state, messages } = useStore()
  const [locataireId, setLocataireId] = useState(state.locataires[0]?.id || '')
  const [brouillon, setBrouillon] = useState(emptyMessage)

  const historique = useMemo(
    () => [...state.messages].filter((m) => m.locataireId === locataireId).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [state.messages, locataireId],
  )

  function envoyer(e) {
    e.preventDefault()
    if (!locataireId) return
    messages.add({ ...brouillon, locataireId, date: new Date().toISOString().slice(0, 10) })
    setBrouillon(emptyMessage)
  }

  function supprimer(m) {
    if (confirm('Supprimer ce message de l\'historique ?')) messages.remove(m.id)
  }

  if (state.locataires.length === 0) {
    return (
      <div>
        <PageHeader title="Messagerie" subtitle="Communication avec vos locataires" />
        <EmptyState title="Aucun locataire disponible" subtitle="Ajoutez un locataire pour commencer une conversation." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Messagerie" subtitle="Historique de communication avec vos locataires" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Locataires</h2>
          <div className="space-y-1">
            {state.locataires.map((l) => {
              const nb = state.messages.filter((m) => m.locataireId === l.id).length
              return (
                <button
                  key={l.id}
                  onClick={() => setLocataireId(l.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    l.id === locataireId ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{l.prenom} {l.nom}</span>
                  {nb > 0 && <span className="text-xs text-slate-400">{nb}</span>}
                </button>
              )
            })}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Nouveau message</h2>
            <form onSubmit={envoyer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Canal">
                  <Select value={brouillon.canal} onChange={(e) => setBrouillon((b) => ({ ...b, canal: e.target.value }))}>
                    {CANAUX.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </Field>
                <Field label="Sens">
                  <Select value={brouillon.sens} onChange={(e) => setBrouillon((b) => ({ ...b, sens: e.target.value }))}>
                    <option value="envoye">Envoyé au locataire</option>
                    <option value="recu">Reçu du locataire</option>
                  </Select>
                </Field>
              </div>
              <Field label="Sujet">
                <Input required value={brouillon.sujet} onChange={(e) => setBrouillon((b) => ({ ...b, sujet: e.target.value }))} />
              </Field>
              <Field label="Contenu">
                <Textarea required rows={4} value={brouillon.contenu} onChange={(e) => setBrouillon((b) => ({ ...b, contenu: e.target.value }))} />
              </Field>
              <Button type="submit">Enregistrer dans l'historique</Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Historique des messages</h2>
            {historique.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun message avec ce locataire pour le moment.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {historique.map((m) => (
                  <div key={m.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">{m.sujet}</p>
                        <Badge tone={m.sens === 'envoye' ? 'blue' : 'slate'}>{m.sens === 'envoye' ? 'Envoyé' : 'Reçu'}</Badge>
                        <Badge tone="slate">{CANAUX.find((c) => c.value === m.canal)?.label || m.canal}</Badge>
                      </div>
                      <Button variant="ghost" onClick={() => supprimer(m)}>Suppr.</Button>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{m.contenu}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(m.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
