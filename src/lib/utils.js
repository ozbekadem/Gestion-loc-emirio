export function formatMontant(value) {
  const n = Number(value) || 0
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR')
}

export const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function moisCourant() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function labelMois(moisKey) {
  const [annee, mois] = moisKey.split('-').map(Number)
  return `${MOIS_FR[mois - 1]} ${annee}`
}

// Décale une clé de mois ("AAAA-MM") d'un nombre de mois positif ou négatif.
export function moisDecale(moisKey, delta) {
  const [annee, mois] = moisKey.split('-').map(Number)
  const d = new Date(annee, mois - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Retrouve l'immeuble d'un bail en remontant bail -> bien -> immeuble.
export function immeubleDuBail(state, bailId) {
  const bail = state.baux.find((b) => b.id === bailId)
  const bien = bail ? state.biens.find((b) => b.id === bail.bienId) : null
  return bien?.immeubleId || null
}

export const STATUTS_PAIEMENT = [
  { value: 'paye', label: 'Payé', tone: 'green', cellClass: 'bg-success-100 text-success-700 hover:bg-success-200' },
  { value: 'partiel', label: 'Partiel', tone: 'amber', cellClass: 'bg-warning-100 text-warning-700 hover:bg-warning-200' },
  { value: 'retard', label: 'Retard', tone: 'red', cellClass: 'bg-danger-100 text-danger-700 hover:bg-danger-200' },
  { value: 'attendu', label: 'Attendu', tone: 'slate', cellClass: 'bg-slate-50 text-slate-400 hover:bg-slate-100' },
]

export function statutPaiementInfo(value) {
  return STATUTS_PAIEMENT.find((s) => s.value === value) || STATUTS_PAIEMENT[3]
}

export const STATUTS_LOCATAIRE = [
  { value: 'excellent_payeur', label: 'Excellent payeur', tone: 'green' },
  { value: 'bon_payeur', label: 'Bon payeur', tone: 'blue' },
  { value: 'mauvais_payeur', label: 'Mauvais payeur', tone: 'red' },
  { value: 'nouveau', label: 'Nouveau', tone: 'slate' },
]

export function statutLocataireInfo(value) {
  return STATUTS_LOCATAIRE.find((s) => s.value === value) || STATUTS_LOCATAIRE[3]
}

// Reversement au propriétaire = ce qu'on lui doit une fois le loyer encaissé,
// après déduction des frais de gestion de l'agence.
export function montantAReverser(paiement) {
  const percu = Number(paiement?.montantPaye) || 0
  const frais = Number(paiement?.fraisGestion) || 0
  return Math.max(0, percu - frais)
}

export function statutReversement(paiement) {
  const recu = paiement?.statut === 'paye' || paiement?.statut === 'partiel'
  if (!recu) return null
  return paiement.dateReversement ? 'reverse' : 'a_reverser'
}

export const STATUTS_REVERSEMENT = {
  a_reverser: { label: 'À reverser', tone: 'amber' },
  reverse: { label: 'Reversé', tone: 'green' },
}

// wa.me exige un numéro international sans le 0 initial. Les prestataires de
// la demo étant belges, on suppose le +32 par défaut faute d'indicatif saisi.
export function lienWhatsapp(telephone, message) {
  let chiffres = String(telephone || '').replace(/[^\d+]/g, '')
  if (chiffres.startsWith('+')) chiffres = chiffres.slice(1)
  else if (chiffres.startsWith('00')) chiffres = chiffres.slice(2)
  else if (chiffres.startsWith('0')) chiffres = `32${chiffres.slice(1)}`
  return `https://wa.me/${chiffres}?text=${encodeURIComponent(message)}`
}

export function lienEmail(email, sujet, corps) {
  return `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
}

// Texte type d'un rappel de loyer impayé, envoyé au locataire.
export function texteRappelLoyer(locataire, montant, moisLabel) {
  return [
    `Objet : Rappel de loyer — ${moisLabel}`,
    '',
    `Bonjour ${locataire.prenom},`,
    '',
    `Nous n'avons pas encore reçu le paiement de votre loyer de ${moisLabel}, d'un montant de ${formatMontant(montant)}.`,
    "Merci de bien vouloir régulariser cette situation dans les meilleurs délais.",
    '',
    "N'hésitez pas à nous contacter si un problème empêche ce paiement.",
    '',
    'Cordialement,',
  ].join('\n')
}
