import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Field, Input, Select, Textarea, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate } from '../lib/utils.js'

const CANAUX = [
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'courrier', label: 'Courrier' },
  { value: 'virement', label: 'Virement' },
  { value: 'autre', label: 'Autre' },
]

const emptyMessage = { canal: 'email', sujet: '', contenu: '', sens: 'envoye' }

export default function Messagerie() {
  const { state, messages } = useStore()
  const [mode, setMode] = useState('locataires')
  const [locataireId, setLocataireId] = useState(state.locataires[0]?.id || '')
  const [immeubleId, setImmeubleId] = useState(state.immeubles[0]?.id || '')
  const [recherche, setRecherche] = useState('')
  const [brouillon, setBrouillon] = useState(emptyMessage)

  const locatairesFiltres = state.locataires.filter((l) =>
    `${l.prenom} ${l.nom}`.toLowerCase().includes(recherche.toLowerCase()),
  )
  const immeublesFiltres = state.immeubles.filter((im) =>
    im.nom.toLowerCase().includes(recherche.toLowerCase()),
  )

  const destinataireId = mode === 'locataires' ? locataireId : immeubleId
  const immeubleSelectionne = state.immeubles.find((im) => im.id === immeubleId)

  const historique = useMemo(() => {
    const filtre = mode === 'locataires'
      ? (m) => m.destinataire !== 'proprietaire' && m.locataireId === locataireId
      : (m) => m.destinataire === 'proprietaire' && m.immeubleId === immeubleId
    return [...state.messages].filter(filtre).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [state.messages, mode, locataireId, immeubleId])

  function envoyer(e) {
    e.preventDefault()
    if (!destinataireId) return
    if (mode === 'locataires') {
      messages.add({ ...brouillon, locataireId, destinataire: 'locataire', date: new Date().toISOString().slice(0, 10) })
    } else {
      messages.add({ ...brouillon, immeubleId, destinataire: 'proprietaire', date: new Date().toISOString().slice(0, 10) })
    }
    setBrouillon(emptyMessage)
  }

  function supprimer(m) {
    if (confirm("Supprimer ce message de l'historique ?")) messages.remove(m.id)
  }

  if (state.locataires.length === 0 && state.immeubles.length === 0) {
    return (
      <div>
        <PageHeader title="Messagerie" subtitle="Communication avec vos locataires et propriétaires" />
        <EmptyState title="Aucun contact disponible" subtitle="Ajoutez un immeuble ou un locataire pour commencer une conversation." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Messagerie" subtitle="Historique de communication avec vos locataires et propriétaires" />

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => { setMode('locataires'); setRecherche('') }}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${mode === 'locataires' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Locataires
        </button>
        <button
          onClick={() => { setMode('proprietaires'); setRecherche('') }}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${mode === 'proprietaires' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Propriétaires
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <Input
            placeholder={mode === 'locataires' ? 'Rechercher un locataire...' : 'Rechercher un immeuble...'}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="mb-3"
          />
          <div className="max-h-[28rem] space-y-1 overflow-y-auto">
            {mode === 'locataires' ? (
              locatairesFiltres.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-400">Aucun locataire trouvé.</p>
              ) : locatairesFiltres.map((l) => {
                const nb = state.messages.filter((m) => m.destinataire !== 'proprietaire' && m.locataireId === l.id).length
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
              })
            ) : (
              immeublesFiltres.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-400">Aucun immeuble trouvé.</p>
              ) : immeublesFiltres.map((im) => {
                const nb = state.messages.filter((m) => m.destinataire === 'proprietaire' && m.immeubleId === im.id).length
                return (
                  <button
                    key={im.id}
                    onClick={() => setImmeubleId(im.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                      im.id === immeubleId ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>
                      {im.nom}
                      {!im.proprietaireNom && <span className="ml-1 text-xs text-warning-600">(sans contact)</span>}
                    </span>
                    {nb > 0 && <span className="text-xs text-slate-400">{nb}</span>}
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {mode === 'proprietaires' && immeubleSelectionne && !immeubleSelectionne.proprietaireNom && (
            <Card className="border-warning-200 bg-warning-50">
              <p className="text-sm text-warning-700">
                Aucun contact propriétaire renseigné pour "{immeubleSelectionne.nom}". Ajoutez-le depuis la page Immeubles pour garder une trace de qui vous contactez.
              </p>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Nouveau message {mode === 'proprietaires' && immeubleSelectionne?.proprietaireNom ? `à ${immeubleSelectionne.proprietaireNom}` : ''}
            </h2>
            <form onSubmit={envoyer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Canal">
                  <Select value={brouillon.canal} onChange={(e) => setBrouillon((b) => ({ ...b, canal: e.target.value }))}>
                    {CANAUX.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </Field>
                <Field label="Sens">
                  <Select value={brouillon.sens} onChange={(e) => setBrouillon((b) => ({ ...b, sens: e.target.value }))}>
                    <option value="envoye">Envoyé</option>
                    <option value="recu">Reçu</option>
                  </Select>
                </Field>
              </div>
              <Field label="Sujet">
                <Input required value={brouillon.sujet} onChange={(e) => setBrouillon((b) => ({ ...b, sujet: e.target.value }))} />
              </Field>
              <Field label="Contenu">
                <Textarea required rows={4} value={brouillon.contenu} onChange={(e) => setBrouillon((b) => ({ ...b, contenu: e.target.value }))} />
              </Field>
              <Button type="submit" disabled={!destinataireId}>Enregistrer dans l'historique</Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Historique des messages</h2>
            {historique.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun message pour le moment.</p>
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
