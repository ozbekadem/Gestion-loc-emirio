import { describe, expect, it } from 'vitest'
import { getTaches, itemsAdminBail, CHECKLIST_ADMIN } from './taches.js'

const JOUR_MS = 24 * 60 * 60 * 1000

function ilYA(jours) {
  return new Date(Date.now() - jours * JOUR_MS).toISOString().slice(0, 10)
}

function dans(jours) {
  return new Date(Date.now() + jours * JOUR_MS).toISOString().slice(0, 10)
}

// État minimal avec toutes les collections attendues par getTaches ; les
// tests ne renseignent que ce qui est pertinent pour le scénario couvert.
function buildState(overrides = {}) {
  return {
    immeubles: [],
    biens: [],
    locataires: [],
    baux: [],
    paiements: [],
    travaux: [],
    sinistres: [],
    documents: [],
    etatsDesLieux: [],
    ...overrides,
  }
}

const bailAJour = {
  id: 'bail-1',
  locataireId: 'loc-1',
  bienId: 'bien-1',
  statut: 'actif',
  dateDebut: ilYA(400),
  dateFin: dans(400),
  dateEntretienChaudiere: ilYA(10),
  dateAttestationAssurance: ilYA(10),
  dateVisiteAnnuelle: ilYA(10),
  dateOres: ilYA(10),
  dateSwde: ilYA(10),
}

const locataire = { id: 'loc-1', prenom: 'Julie', nom: 'Dupuis' }
const bien = { id: 'bien-1', nom: 'Appt 2', immeubleId: 'im-1' }
const immeuble = { id: 'im-1', nom: 'Résidence Le Parc', proprietaireNom: 'Jean Ozbek' }
const edlEntree = { bailId: 'bail-1', type: 'entree' }
const pieceIdentite = { locataireId: 'loc-1', type: 'carte_identite' }

describe('itemsAdminBail', () => {
  it('marque un item comme "ok" quand la date est renseignée et récente', () => {
    const items = itemsAdminBail(bailAJour)
    expect(items).toHaveLength(CHECKLIST_ADMIN.length)
    expect(items.every((it) => it.ok)).toBe(true)
  })

  it('marque un item en retard au-delà du délai attendu (365 jours)', () => {
    const items = itemsAdminBail({ ...bailAJour, dateEntretienChaudiere: ilYA(400) })
    const chaudiere = items.find((it) => it.key === 'dateEntretienChaudiere')
    expect(chaudiere.enRetard).toBe(true)
    expect(chaudiere.ok).toBe(false)
  })

  it('marque un item manquant comme non "ok" (date absente)', () => {
    const items = itemsAdminBail({ ...bailAJour, dateOres: undefined })
    const ores = items.find((it) => it.key === 'dateOres')
    expect(ores.ok).toBe(false)
  })
})

describe('getTaches — reversements en attente', () => {
  const paiementDeBase = {
    id: 'p1',
    bailId: 'bail-1',
    mois: '2026-01',
    statut: 'paye',
  }

  it("ne signale rien pour un paiement perçu depuis moins de 7 jours", () => {
    const state = buildState({
      baux: [bailAJour],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
      paiements: [{ ...paiementDeBase, datePaiement: ilYA(3) }],
    })
    const taches = getTaches(state)
    expect(taches.find((t) => t.type === 'reversement_en_attente')).toBeUndefined()
  })

  it('signale un reversement en attente (urgence moyenne) entre 7 et 15 jours', () => {
    const state = buildState({
      baux: [bailAJour],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
      paiements: [{ ...paiementDeBase, datePaiement: ilYA(10) }],
    })
    const tache = getTaches(state).find((t) => t.type === 'reversement_en_attente')
    expect(tache).toBeDefined()
    expect(tache.urgence).toBe('moyenne')
    expect(tache.titre).toContain('Julie Dupuis')
  })

  it('passe en urgence haute au-delà de 15 jours', () => {
    const state = buildState({
      baux: [bailAJour],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
      paiements: [{ ...paiementDeBase, datePaiement: ilYA(20) }],
    })
    const tache = getTaches(state).find((t) => t.type === 'reversement_en_attente')
    expect(tache.urgence).toBe('haute')
  })

  it('ignore un paiement déjà reversé', () => {
    const state = buildState({
      baux: [bailAJour],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
      paiements: [{ ...paiementDeBase, datePaiement: ilYA(20), dateReversement: ilYA(1) }],
    })
    expect(getTaches(state).find((t) => t.type === 'reversement_en_attente')).toBeUndefined()
  })

  it('ignore les paiements non perçus (statut "retard" ou "attendu")', () => {
    const state = buildState({
      baux: [bailAJour],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
      paiements: [{ ...paiementDeBase, statut: 'retard', datePaiement: ilYA(30) }],
    })
    expect(getTaches(state).find((t) => t.type === 'reversement_en_attente')).toBeUndefined()
  })
})

describe('getTaches — baux actifs', () => {
  it('ne génère aucune tâche administrative pour un bail à jour', () => {
    const state = buildState({
      baux: [bailAJour],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
    })
    expect(getTaches(state).filter((t) => t.locataireId === 'loc-1')).toHaveLength(0)
  })

  it('signale un dossier administratif incomplet', () => {
    const bailIncomplet = { ...bailAJour, dateEntretienChaudiere: undefined, dateOres: undefined }
    const state = buildState({
      baux: [bailIncomplet],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
    })
    const tache = getTaches(state).find((t) => t.type === 'dossier_administratif')
    expect(tache).toBeDefined()
    expect(tache.detail).toContain('Entretien chaudière')
    expect(tache.detail).toContain('Décompte ORES')
  })

  it('passe le dossier administratif en urgence haute à partir de 3 items manquants', () => {
    const bailTresIncomplet = {
      ...bailAJour,
      dateEntretienChaudiere: undefined,
      dateAttestationAssurance: undefined,
      dateVisiteAnnuelle: undefined,
    }
    const state = buildState({
      baux: [bailTresIncomplet],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
    })
    const tache = getTaches(state).find((t) => t.type === 'dossier_administratif')
    expect(tache.urgence).toBe('haute')
  })

  it("signale une échéance de bail proche (moins de 90 jours)", () => {
    const bailQuiSeTermine = { ...bailAJour, dateFin: dans(45) }
    const state = buildState({
      baux: [bailQuiSeTermine],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
    })
    const tache = getTaches(state).find((t) => t.type === 'echeance_bail')
    expect(tache).toBeDefined()
    expect(tache.urgence).toBe('moyenne')
  })

  it("passe l'échéance de bail en urgence haute sous 30 jours", () => {
    const bailQuiSeTermine = { ...bailAJour, dateFin: dans(10) }
    const state = buildState({
      baux: [bailQuiSeTermine],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
    })
    const tache = getTaches(state).find((t) => t.type === 'echeance_bail')
    expect(tache.urgence).toBe('haute')
  })

  it("ne signale pas d'échéance pour un bail encore loin de son terme", () => {
    const state = buildState({
      baux: [bailAJour], // dateFin dans 400 jours
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [edlEntree],
      documents: [pieceIdentite],
    })
    expect(getTaches(state).find((t) => t.type === 'echeance_bail')).toBeUndefined()
  })

  it("signale un état des lieux d'entrée manquant", () => {
    const state = buildState({
      baux: [bailAJour],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
      etatsDesLieux: [], // aucun EDL enregistré
      documents: [pieceIdentite],
    })
    const tache = getTaches(state).find((t) => t.type === 'etat_des_lieux')
    expect(tache).toBeDefined()
    expect(tache.titre).toContain('Julie Dupuis')
  })

  it("n'inclut pas les baux inactifs (résiliés / terminés)", () => {
    const bailInactif = { ...bailAJour, statut: 'termine', dateFin: dans(10) }
    const state = buildState({
      baux: [bailInactif],
      locataires: [locataire],
      biens: [bien],
      immeubles: [immeuble],
    })
    expect(getTaches(state).find((t) => t.type === 'echeance_bail')).toBeUndefined()
  })
})

describe('getTaches — locataires, immeubles, sinistres, travaux', () => {
  it("signale une pièce d'identité manquante", () => {
    const state = buildState({ locataires: [locataire], documents: [] })
    const tache = getTaches(state).find((t) => t.type === 'identite_manquante')
    expect(tache).toBeDefined()
    expect(tache.urgence).toBe('basse')
  })

  it('signale un propriétaire manquant sur un immeuble', () => {
    const state = buildState({ immeubles: [{ id: 'im-2', nom: 'Bellevue', proprietaireNom: '' }] })
    const tache = getTaches(state).find((t) => t.type === 'proprietaire_manquant')
    expect(tache).toBeDefined()
  })

  it('signale un sinistre en cours non suivi depuis plus de 30 jours', () => {
    const state = buildState({
      immeubles: [immeuble],
      sinistres: [{ id: 's1', immeubleId: 'im-1', type: 'Dégât des eaux', statut: 'en_cours', dateSinistre: ilYA(45) }],
    })
    const tache = getTaches(state).find((t) => t.type === 'sinistre_suivi')
    expect(tache).toBeDefined()
    expect(tache.detail).toContain('45 jours')
  })

  it('ignore un sinistre récent ou déjà clôturé', () => {
    const stateRecent = buildState({
      sinistres: [{ id: 's2', statut: 'en_cours', dateSinistre: ilYA(5) }],
    })
    expect(getTaches(stateRecent).find((t) => t.type === 'sinistre_suivi')).toBeUndefined()

    const stateClos = buildState({
      sinistres: [{ id: 's3', statut: 'cloture', dateSinistre: ilYA(90) }],
    })
    expect(getTaches(stateClos).find((t) => t.type === 'sinistre_suivi')).toBeUndefined()
  })

  it('signale un travail urgent non terminé', () => {
    const state = buildState({
      immeubles: [immeuble],
      travaux: [{ id: 't1', immeubleId: 'im-1', titre: 'Fuite de gaz', urgence: 'urgente', statut: 'a_planifier' }],
    })
    const tache = getTaches(state).find((t) => t.type === 'travaux_urgent')
    expect(tache).toBeDefined()
    expect(tache.urgence).toBe('haute')
  })

  it('ignore un travail urgent déjà terminé', () => {
    const state = buildState({
      travaux: [{ id: 't2', urgence: 'urgente', statut: 'termine' }],
    })
    expect(getTaches(state).find((t) => t.type === 'travaux_urgent')).toBeUndefined()
  })
})

describe('getTaches — tri', () => {
  it('trie les tâches par urgence décroissante (haute, moyenne, basse)', () => {
    const state = buildState({
      locataires: [{ id: 'loc-2', prenom: 'A', nom: 'Basse' }], // identite_manquante -> basse
      immeubles: [{ id: 'im-3', nom: 'X', proprietaireNom: '' }], // proprietaire_manquant -> basse
      travaux: [{ id: 't3', immeubleId: 'im-3', titre: 'Urgent', urgence: 'urgente', statut: 'en_cours' }], // haute
      sinistres: [{ id: 's4', immeubleId: 'im-3', type: 'Dégât', statut: 'en_cours', dateSinistre: ilYA(40) }], // moyenne
    })
    const urgences = getTaches(state).map((t) => t.urgence)
    const ordreAttendu = { haute: 0, moyenne: 1, basse: 2 }
    const tri = [...urgences].sort((a, b) => ordreAttendu[a] - ordreAttendu[b])
    expect(urgences).toEqual(tri)
  })
})
