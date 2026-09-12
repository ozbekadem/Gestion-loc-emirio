import React, { useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, Modal, Field, Input, Select, Textarea, Badge, EmptyState } from '../components/ui.jsx'
import { formatDate, formatMontant, lienWhatsapp, lienEmail } from '../lib/utils.js'
import { makeId } from '../lib/id.js'

const STATUTS = [
  { value: 'a_planifier', label: 'À planifier', tone: 'slate' },
  { value: 'en_cours', label: 'En cours', tone: 'amber' },
  { value: 'termine', label: 'Terminé', tone: 'green' },
]

const CATEGORIES = [
  'Plomberie', 'Électricité', 'Chauffage', 'Gaz', 'Menuiserie', 'Peinture', 'Carrelage',
  'Serrurerie', 'Vitrerie', 'Toiture', 'Isolation', 'Nettoyage', 'Jardinage', 'Entretien',
  'Gros travaux', 'Autre',
]

const URGENCES = [
  { value: 'normale', label: 'Normale' },
  { value: 'urgente', label: 'Urgente' },
]

const emptyTravail = {
  immeubleId: '', bienId: '', titre: '', description: '', prestataireId: '', statut: 'a_planifier', cout: '', date: '',
  categorie: CATEGORIES[0], urgence: 'normale', photos: [], rapportPrestataire: '', dateRapport: '',
}

export default function Travaux() {
  const { state, travaux, messages } = useStore()
  const [modal, setModal] = useState(null)
  const [filtreImmeuble, setFiltreImmeuble] = useState('')
  const [notif, setNotif] = useState(null)
  const [contact, setContact] = useState(null)
  const [momentPhoto, setMomentPhoto] = useState('avant')
  const photoInput = useRef(null)

  function openNew() {
    setModal({ mode: 'create', values: emptyTravail })
  }
  function openEdit(t) {
    setModal({ mode: 'edit', id: t.id, values: { photos: [], rapportPrestataire: '', dateRapport: '', ...t } })
  }
  function save(e) {
    e.preventDefault()
    const { mode, id, values } = modal
    const payload = { ...values, cout: Number(values.cout) || 0 }
    if (mode === 'create') travaux.add(payload)
    else travaux.update(id, payload)
    setModal(null)
  }
  function remove(t) {
    if (confirm(`Supprimer le travail "${t.titre}" ?`)) travaux.remove(t.id)
  }

  function ajouterPhotos(e) {
    const files = [...(e.target.files || [])]
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setModal((m) => ({
          ...m,
          values: { ...m.values, photos: [...(m.values.photos || []), { id: makeId(), dataUrl: reader.result, moment: momentPhoto, nom: file.name }] },
        }))
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }
  function retirerPhoto(photoId) {
    setModal((m) => ({ ...m, values: { ...m.values, photos: m.values.photos.filter((p) => p.id !== photoId) } }))
  }

  const biensDeImmeuble = state.biens.filter((b) => b.immeubleId === modal?.values.immeubleId)
  const liste = state.travaux
    .filter((t) => !filtreImmeuble || t.immeubleId === filtreImmeuble)
    .sort((a, b) => {
      const poids = (t) => (t.statut !== 'termine' && t.urgence === 'urgente' ? 0 : t.statut !== 'termine' ? 1 : 2)
      return poids(a) - poids(b)
    })

  function statutInfo(v) {
    return STATUTS.find((s) => s.value === v) || STATUTS[0]
  }

  function notifierProprietaire(t) {
    const immeuble = state.immeubles.find((i) => i.id === t.immeubleId)
    const bien = state.biens.find((b) => b.id === t.bienId)
    if (!immeuble) return
    const texte = [
      `Objet : Travaux — ${t.titre} — ${immeuble.nom}`,
      '',
      `Bonjour${immeuble.proprietaireNom ? ` ${immeuble.proprietaireNom}` : ''},`,
      '',
      `Une intervention "${t.titre}" (${t.categorie}) est ${t.statut === 'termine' ? 'terminée' : t.statut === 'en_cours' ? 'en cours' : 'à planifier'} sur votre bien ${immeuble.nom}${bien ? ` (${bien.nom})` : ''}${t.urgence === 'urgente' ? ', signalée comme urgente' : ''}.`,
      t.description ? `Détails : ${t.description}` : '',
      `Coût estimé : ${formatMontant(t.cout)}.`,
      '',
      'Nous restons à votre disposition pour toute question.',
      '',
      'Cordialement,',
    ].filter(Boolean).join('\n')
    messages.add({
      immeubleId: immeuble.id,
      destinataire: 'proprietaire',
      canal: 'email',
      sujet: `Travaux — ${t.titre} — ${immeuble.nom}`,
      contenu: texte,
      date: new Date().toISOString().slice(0, 10),
      sens: 'envoye',
    })
    setNotif({ immeuble, texte })
  }

  function contacterPrestataire(t) {
    const prestataire = state.prestataires.find((p) => p.id === t.prestataireId)
    if (!prestataire) return
    const immeuble = state.immeubles.find((i) => i.id === t.immeubleId)
    const bien = state.biens.find((b) => b.id === t.bienId)
    const texte = [
      `Bonjour ${prestataire.nom},`,
      '',
      `Une intervention est à prévoir : ${t.titre}${t.categorie ? ` (${t.categorie})` : ''}.`,
      immeuble ? `Lieu : ${immeuble.nom}${bien ? ` — ${bien.nom}` : ''}${immeuble.adresse ? `, ${immeuble.adresse}` : ''}` : '',
      t.urgence === 'urgente' ? 'Cette intervention est urgente, merci de nous indiquer votre disponibilité rapidement.' : '',
      t.description ? `Description du problème : ${t.description}` : '',
      '',
      "Merci de nous transmettre un compte-rendu (avec photos avant/après si possible) une fois l'intervention réalisée.",
      '',
      'Cordialement,',
    ].filter(Boolean).join('\n')
    setContact({ travail: t, prestataire, texte })
  }

  return (
    <div>
      <PageHeader
        title="Travaux"
        subtitle="Suivi des interventions et de leur coût"
        action={<Button onClick={openNew}>+ Ajouter un travail</Button>}
      />

      {state.immeubles.length > 0 && (
        <Select className="mb-4 max-w-xs" value={filtreImmeuble} onChange={(e) => setFiltreImmeuble(e.target.value)}>
          <option value="">Tous les immeubles</option>
          {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
        </Select>
      )}

      {liste.length === 0 ? (
        <EmptyState title="Aucun travail pour cet immeuble" subtitle="Ajoutez une intervention à planifier ou en cours." action={<Button className="mt-2" onClick={openNew}>Ajouter un travail</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((t) => {
            const immeuble = state.immeubles.find((i) => i.id === t.immeubleId)
            const bien = state.biens.find((b) => b.id === t.bienId)
            const prestataire = state.prestataires.find((p) => p.id === t.prestataireId)
            const info = statutInfo(t.statut)
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900">{t.titre}</h3>
                  <div className="flex gap-1.5">
                    {t.urgence === 'urgente' && <Badge tone="red">Urgente</Badge>}
                    <Badge tone={info.tone}>{info.label}</Badge>
                  </div>
                </div>
                {t.categorie && <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">{t.categorie}</p>}
                {t.description && <p className="mt-1 text-sm text-slate-500">{t.description}</p>}
                <div className="mt-3 space-y-0.5 text-sm text-slate-600">
                  <p>{immeuble ? immeuble.nom : '—'}{bien ? ` — ${bien.nom}` : ''}</p>
                  {prestataire && <p>Prestataire : {prestataire.nom}</p>}
                  {t.date && <p>Date : {formatDate(t.date)}</p>}
                  <p className="font-medium text-slate-800">{formatMontant(t.cout)}</p>
                </div>

                {(t.photos?.length > 0 || t.rapportPrestataire) && (
                  <div className="mt-3 border-t border-slate-100 pt-2">
                    {t.photos?.length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto">
                        {t.photos.map((p) => (
                          <div key={p.id} className="relative shrink-0">
                            <img src={p.dataUrl} alt="" className="h-14 w-14 rounded object-cover" />
                            <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] text-white">{p.moment === 'avant' ? 'Avant' : 'Après'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {t.rapportPrestataire && <p className="mt-2 text-xs text-slate-500">📝 {t.rapportPrestataire}</p>}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {prestataire && <Button variant="accent" onClick={() => contacterPrestataire(t)}>Contacter le prestataire</Button>}
                  <Button variant="secondary" onClick={() => notifierProprietaire(t)}>Notifier propriétaire</Button>
                  <Button variant="ghost" onClick={() => openEdit(t)}>Modifier</Button>
                  <Button variant="danger" onClick={() => remove(t)}>Supprimer</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Modifier le travail' : 'Ajouter un travail'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" form="form-travail">Enregistrer</Button>
          </>
        }
      >
        {modal && (
          <form id="form-travail" onSubmit={save} className="space-y-4">
            <Field label="Titre">
              <Input required value={modal.values.titre} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, titre: e.target.value } }))} />
            </Field>
            <Field label="Description">
              <Textarea value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Catégorie">
                <Select value={modal.values.categorie} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, categorie: e.target.value } }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Urgence">
                <Select value={modal.values.urgence} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, urgence: e.target.value } }))}>
                  {URGENCES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Immeuble">
                <Select value={modal.values.immeubleId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, immeubleId: e.target.value, bienId: '' } }))}>
                  <option value="">— Aucun —</option>
                  {state.immeubles.map((im) => <option key={im.id} value={im.id}>{im.nom}</option>)}
                </Select>
              </Field>
              <Field label="Bien concerné">
                <Select value={modal.values.bienId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, bienId: e.target.value } }))}>
                  <option value="">— Aucun —</option>
                  {biensDeImmeuble.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Prestataire">
              <Select value={modal.values.prestataireId} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, prestataireId: e.target.value } }))}>
                <option value="">— Aucun —</option>
                {state.prestataires.map((p) => <option key={p.id} value={p.id}>{p.nom}{p.metier ? ` — ${p.metier}` : ''}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Coût (€)">
                <Input type="number" min="0" value={modal.values.cout} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, cout: e.target.value } }))} />
              </Field>
              <Field label="Date">
                <Input type="date" value={modal.values.date} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, date: e.target.value } }))} />
              </Field>
            </div>
            <Field label="Statut">
              <Select value={modal.values.statut} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, statut: e.target.value } }))}>
                {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>

            <Field label="Photos">
              <div className="flex items-center gap-2">
                <Select value={momentPhoto} onChange={(e) => setMomentPhoto(e.target.value)} className="max-w-[8rem]">
                  <option value="avant">Avant</option>
                  <option value="apres">Après</option>
                </Select>
                <Button type="button" variant="secondary" onClick={() => photoInput.current?.click()}>+ Ajouter une photo</Button>
                <input ref={photoInput} type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} />
              </div>
              {modal.values.photos?.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {modal.values.photos.map((p) => (
                    <div key={p.id} className="relative">
                      <img src={p.dataUrl} alt="" className="h-16 w-full rounded object-cover" />
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">{p.moment === 'avant' ? 'Avant' : 'Après'}</span>
                      <button type="button" onClick={() => retirerPhoto(p.id)} className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Rapport du prestataire (retour)">
                <Textarea placeholder="À recopier depuis le WhatsApp / e-mail reçu du prestataire" value={modal.values.rapportPrestataire} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, rapportPrestataire: e.target.value } }))} />
              </Field>
              <Field label="Date du rapport">
                <Input type="date" value={modal.values.dateRapport} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, dateRapport: e.target.value } }))} />
              </Field>
            </div>
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

      <Modal
        open={!!contact}
        onClose={() => setContact(null)}
        title={contact ? `Contacter ${contact.prestataire.nom}` : ''}
        footer={<Button onClick={() => setContact(null)}>Fermer</Button>}
      >
        {contact && (
          <>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{contact.texte}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              {contact.prestataire.telephone && (
                <a
                  href={lienWhatsapp(contact.prestataire.telephone, contact.texte)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-accent px-4 py-2 text-sm font-medium text-white shadow-soft transition-all duration-150 hover:shadow-glow-accent hover:brightness-110 active:scale-[0.98]"
                >
                  Envoyer par WhatsApp
                </a>
              )}
              {contact.prestataire.email && (
                <a
                  href={lienEmail(contact.prestataire.email, `Intervention — ${contact.travail.titre}`, contact.texte)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-700 active:scale-[0.98]"
                >
                  Envoyer par e-mail
                </a>
              )}
              {!contact.prestataire.telephone && !contact.prestataire.email && (
                <p className="text-sm text-warning-600">Aucun téléphone ni e-mail renseigné pour ce prestataire — ajoutez-en un depuis la page Prestataires.</p>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Ces liens ouvrent WhatsApp ou votre messagerie avec le message déjà rédigé — il ne reste qu'à cliquer sur envoyer (et à joindre vos photos manuellement, ces liens ne les attachent pas automatiquement). Quand le prestataire vous répond, recopiez son compte-rendu et ses photos dans la fiche du travail via "Modifier".
            </p>
          </>
        )}
      </Modal>
    </div>
  )
}
