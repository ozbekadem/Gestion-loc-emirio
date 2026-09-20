export const TYPES_DOCUMENT = [
  { value: 'carte_identite', label: "Pièce d'identité" },
  { value: 'contrat_bail', label: 'Contrat de bail' },
  { value: 'assurance', label: 'Attestation assurance' },
  { value: 'autre', label: 'Autre document' },
]

export const PIECES_DEFAUT = ['Entrée', 'Séjour', 'Cuisine', 'Chambre 1', 'Chambre 2', 'Salle de bain', 'WC']

export const ETATS_PIECE = [
  { value: 'bon', label: 'Bon' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'mauvais', label: 'Mauvais' },
]

export function emptyEtatDesLieux(bailId, type) {
  return {
    bailId,
    type,
    date: new Date().toISOString().slice(0, 10),
    pieces: PIECES_DEFAUT.map((nom) => ({ nom, etat: 'bon', commentaire: '' })),
    compteurs: { electricite: '', eau: '', gaz: '' },
    nombreCles: '',
    observations: '',
  }
}

export function toneEtat(etat) {
  return etat === 'bon' ? 'green' : etat === 'moyen' ? 'amber' : 'red'
}
