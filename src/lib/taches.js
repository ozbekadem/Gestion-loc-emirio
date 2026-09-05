import { labelMois } from './utils.js'

const JOUR_MS = 24 * 60 * 60 * 1000

function joursDepuis(dateStr) {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return Infinity
  return Math.floor((Date.now() - d.getTime()) / JOUR_MS)
}

function joursAvant(dateStr) {
  if (!dateStr) return -Infinity
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return -Infinity
  return Math.floor((d.getTime() - Date.now()) / JOUR_MS)
}

export const CHECKLIST_ADMIN = [
  { key: 'dateEntretienChaudiere', label: 'Entretien chaudière', delaiJours: 365 },
  { key: 'dateAttestationAssurance', label: 'Attestation assurance', delaiJours: 365 },
  { key: 'dateVisiteAnnuelle', label: 'Visite annuelle', delaiJours: 365 },
  { key: 'dateOres', label: 'Décompte ORES (élec. & gaz)', delaiJours: 365 },
  { key: 'dateSwde', label: 'Décompte SWDE (eau)', delaiJours: 365 },
]

export function itemsAdminBail(bail) {
  return CHECKLIST_ADMIN.map((item) => {
    const valeur = bail[item.key]
    const jours = joursDepuis(valeur)
    const enRetard = jours > item.delaiJours
    return { ...item, valeur, enRetard, ok: !!valeur && !enRetard }
  })
}

export function getTaches(state) {
  const taches = []

  const bauxActifs = state.baux.filter((b) => b.statut === 'actif')

  state.paiements.forEach((p) => {
    const recu = p.statut === 'paye' || p.statut === 'partiel'
    if (!recu || p.dateReversement) return
    const jours = joursDepuis(p.datePaiement)
    if (jours < 7) return
    const bail = state.baux.find((b) => b.id === p.bailId)
    const loc = bail ? state.locataires.find((l) => l.id === bail.locataireId) : null
    const bien = bail ? state.biens.find((x) => x.id === bail.bienId) : null
    const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
    const nomLoc = loc ? `${loc.prenom} ${loc.nom}` : 'Locataire inconnu'
    taches.push({
      id: `reversement-${p.id}`,
      type: 'reversement_en_attente',
      urgence: jours > 15 ? 'haute' : 'moyenne',
      titre: `Reverser le loyer de ${nomLoc} au propriétaire`,
      detail: `${labelMois(p.mois)} — encaissé depuis ${jours} jours${immeuble?.proprietaireNom ? `, à envoyer à ${immeuble.proprietaireNom}` : ''}`,
      lieu: immeuble?.nom,
      immeubleId: immeuble?.id,
      page: 'reversements',
    })
  })

  bauxActifs.forEach((b) => {
    const loc = state.locataires.find((l) => l.id === b.locataireId)
    const bien = state.biens.find((x) => x.id === b.bienId)
    const immeuble = bien ? state.immeubles.find((i) => i.id === bien.immeubleId) : null
    const nomLoc = loc ? `${loc.prenom} ${loc.nom}` : 'Locataire inconnu'
    const lieu = [immeuble?.nom, bien?.nom].filter(Boolean).join(' — ')

    const itemsManquants = itemsAdminBail(b).filter((it) => !it.ok)
    if (itemsManquants.length > 0) {
      taches.push({
        id: `admin-${b.id}`,
        type: 'dossier_administratif',
        urgence: itemsManquants.length >= 3 ? 'haute' : 'moyenne',
        titre: `Compléter le dossier de ${nomLoc}`,
        detail: itemsManquants.map((it) => it.label).join(', '),
        lieu,
        locataireId: b.locataireId,
        page: 'locataires',
      })
    }

    const joursAvantFin = joursAvant(b.dateFin)
    if (joursAvantFin >= 0 && joursAvantFin <= 90) {
      taches.push({
        id: `echeance-${b.id}`,
        type: 'echeance_bail',
        urgence: joursAvantFin <= 30 ? 'haute' : 'moyenne',
        titre: `Bail de ${nomLoc} arrive à échéance`,
        detail: joursAvantFin === 0 ? "Se termine aujourd'hui" : `Se termine dans ${joursAvantFin} jour${joursAvantFin > 1 ? 's' : ''}`,
        lieu,
        locataireId: b.locataireId,
        page: 'baux',
      })
    }

    const aUnEDL = state.etatsDesLieux.some((e) => e.bailId === b.id && e.type === 'entree')
    if (!aUnEDL) {
      taches.push({
        id: `edl-${b.id}`,
        type: 'etat_des_lieux',
        urgence: 'moyenne',
        titre: `État des lieux d'entrée manquant — ${nomLoc}`,
        detail: 'Aucun état des lieux enregistré pour ce bail',
        lieu,
        locataireId: b.locataireId,
        page: 'locataires',
      })
    }
  })

  state.locataires.forEach((l) => {
    const aUnePieceIdentite = state.documents.some((d) => d.locataireId === l.id && d.type === 'carte_identite')
    if (!aUnePieceIdentite) {
      taches.push({
        id: `identite-${l.id}`,
        type: 'identite_manquante',
        urgence: 'basse',
        titre: `Pièce d'identité manquante — ${l.prenom} ${l.nom}`,
        detail: "Aucune pièce d'identité au dossier",
        locataireId: l.id,
        page: 'locataires',
      })
    }
  })

  state.immeubles.forEach((im) => {
    if (!im.proprietaireNom) {
      taches.push({
        id: `proprio-${im.id}`,
        type: 'proprietaire_manquant',
        urgence: 'basse',
        titre: `Contact propriétaire à renseigner — ${im.nom}`,
        detail: 'Nom, e-mail ou téléphone du propriétaire manquant',
        lieu: im.nom,
        immeubleId: im.id,
        page: 'immeubles',
      })
    }
  })

  state.sinistres.forEach((s) => {
    if (s.statut === 'en_cours' && joursDepuis(s.dateSinistre) > 30) {
      const immeuble = state.immeubles.find((i) => i.id === s.immeubleId)
      taches.push({
        id: `sinistre-${s.id}`,
        type: 'sinistre_suivi',
        urgence: 'moyenne',
        titre: `Relancer le suivi du sinistre — ${s.type}`,
        detail: `Ouvert depuis ${joursDepuis(s.dateSinistre)} jours, dossier ${s.numeroDossier || 'sans numéro'}`,
        lieu: immeuble?.nom,
        immeubleId: s.immeubleId,
        page: 'sinistres',
      })
    }
  })

  state.travaux.forEach((t) => {
    if (t.urgence === 'urgente' && t.statut !== 'termine') {
      const immeuble = state.immeubles.find((i) => i.id === t.immeubleId)
      taches.push({
        id: `travail-${t.id}`,
        type: 'travaux_urgent',
        urgence: 'haute',
        titre: `Travail urgent à traiter — ${t.titre}`,
        detail: t.statut === 'en_cours' ? 'Intervention en cours' : 'À planifier',
        lieu: immeuble?.nom,
        immeubleId: t.immeubleId,
        page: 'travaux',
      })
    }
  })

  const ordreUrgence = { haute: 0, moyenne: 1, basse: 2 }
  return taches.sort((a, b) => ordreUrgence[a.urgence] - ordreUrgence[b.urgence])
}
