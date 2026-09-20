import { useState } from 'react'
import { useStore } from './store.jsx'

// Plomberie commune aux pages qui notifient le propriétaire d'un immeuble par
// message interne (Sinistres, Travaux) : création du message dans l'historique
// et mémorisation du récapitulatif à afficher. Chaque page reste responsable
// de retrouver l'immeuble et de composer son texte, spécifique à son domaine.
export function useNotifierProprietaire() {
  const { messages } = useStore()
  const [notif, setNotif] = useState(null)

  function notifier(immeuble, sujet, texte) {
    messages.add({
      immeubleId: immeuble.id,
      destinataire: 'proprietaire',
      canal: 'email',
      sujet,
      contenu: texte,
      date: new Date().toISOString().slice(0, 10),
      sens: 'envoye',
    })
    setNotif({ immeuble, texte })
  }

  return { notif, setNotif, notifier }
}
