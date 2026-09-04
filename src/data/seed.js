import { makeId } from '../lib/id.js'

const im1 = makeId()
const im2 = makeId()
const b1 = makeId()
const b2 = makeId()
const b3 = makeId()
const loc1 = makeId()
const loc2 = makeId()
const bail1 = makeId()
const bail2 = makeId()
const prest1 = makeId()
const prest2 = makeId()

function paiementsPourAnnee(bailId, montant, statutsParMois) {
  return Object.entries(statutsParMois).map(([mois, statut]) => ({
    id: makeId(),
    bailId,
    mois,
    montantAttendu: montant,
    montantPaye: statut === 'paye' ? montant : statut === 'partiel' ? Math.round(montant * 0.6) : 0,
    datePaiement: statut === 'attendu' || statut === 'retard' ? '' : `${mois}-05`,
    statut,
  }))
}

export function seedData() {
  return {
    immeubles: [
      {
        id: im1,
        nom: 'Résidence Les Tilleuls',
        adresse: '12 rue des Tilleuls',
        codePostal: '75011',
        ville: 'Paris',
        type: 'Immeuble résidentiel',
      },
      {
        id: im2,
        nom: 'Maison Bellevue',
        adresse: '4 avenue Bellevue',
        codePostal: '69003',
        ville: 'Lyon',
        type: 'Maison',
      },
    ],
    biens: [
      { id: b1, immeubleId: im1, nom: 'Appartement 1A', etage: '1', surface: 45, loyerBase: 750, charges: 80 },
      { id: b2, immeubleId: im1, nom: 'Appartement 2B', etage: '2', surface: 62, loyerBase: 980, charges: 100 },
      { id: b3, immeubleId: im2, nom: 'Maison entière', etage: 'RDC', surface: 110, loyerBase: 1400, charges: 0 },
    ],
    locataires: [
      {
        id: loc1,
        bienId: b1,
        nom: 'Bernard',
        prenom: 'Sophie',
        email: 'sophie.bernard@example.com',
        telephone: '06 12 34 56 78',
        dateEntree: '2023-03-01',
        statut: 'excellent_payeur',
      },
      {
        id: loc2,
        bienId: b3,
        nom: 'Ahmed',
        prenom: 'Karim',
        email: 'karim.ahmed@example.com',
        telephone: '06 98 76 54 32',
        dateEntree: '2022-09-15',
        statut: 'mauvais_payeur',
      },
    ],
    baux: [
      {
        id: bail1,
        locataireId: loc1,
        bienId: b1,
        dateDebut: '2023-03-01',
        dateFin: '2026-02-28',
        loyer: 750,
        charges: 80,
        depotGarantie: 1500,
        statut: 'actif',
        frequence: 'mensuel',
        loyerInitial: 700,
        indiceInitial: 120.5,
        indiceActuel: 128.9,
        dateIndexation: '2026-03-01',
      },
      {
        id: bail2,
        locataireId: loc2,
        bienId: b3,
        dateDebut: '2022-09-15',
        dateFin: '2025-09-14',
        loyer: 1400,
        charges: 0,
        depotGarantie: 2800,
        statut: 'actif',
        frequence: 'mensuel',
        loyerInitial: 1350,
        indiceInitial: 118.2,
        indiceActuel: 128.9,
        dateIndexation: '2025-09-15',
      },
    ],
    paiements: [
      ...paiementsPourAnnee(bail1, 830, {
        '2026-01': 'paye', '2026-02': 'paye', '2026-03': 'paye', '2026-04': 'paye',
        '2026-05': 'paye', '2026-06': 'paye', '2026-07': 'paye', '2026-08': 'paye',
      }),
      ...paiementsPourAnnee(bail2, 1400, {
        '2026-01': 'paye', '2026-02': 'paye', '2026-03': 'paye', '2026-04': 'paye',
        '2026-05': 'paye', '2026-06': 'partiel', '2026-07': 'retard', '2026-08': 'retard',
      }),
    ],
    travaux: [
      {
        id: makeId(),
        immeubleId: im1,
        bienId: b2,
        titre: 'Remplacement carrelage salle de bain',
        description: 'Carrelage endommagé à remplacer',
        prestataireId: prest1,
        statut: 'en_cours',
        cout: 850,
        date: '2026-08-20',
        categorie: 'Plomberie',
        urgence: 'normale',
      },
    ],
    prestataires: [
      {
        id: prest1,
        nom: 'Dupont Carrelage',
        metier: 'Carreleur',
        telephone: '01 23 45 67 89',
        email: 'contact@dupont-carrelage.fr',
        adresse: 'Paris',
      },
      {
        id: prest2,
        nom: 'Assurances Provinces Réunies',
        metier: 'Compagnie d\'assurance',
        telephone: '01 98 76 54 32',
        email: 'sinistres@apr-assurances.fr',
        adresse: 'Lyon',
      },
    ],
    candidatures: [],
    agenda: [],
    sinistres: [
      {
        id: makeId(),
        immeubleId: im2,
        bienId: b3,
        type: 'Dégât des eaux',
        compagnieAssurance: 'Assurances Provinces Réunies',
        numeroDossier: 'SIN-2026-0142',
        dateSinistre: '2026-07-10',
        description: 'Infiltration au plafond de la cuisine suite à une fuite de toiture.',
        statut: 'en_cours',
        montantEstime: 1200,
      },
    ],
    messages: [
      {
        id: makeId(),
        locataireId: loc2,
        canal: 'email',
        sujet: 'Rappel de loyer — Juillet 2026',
        contenu: "Bonjour Karim, nous n'avons pas encore reçu le paiement du loyer de juillet. Merci de régulariser dans les meilleurs délais.",
        date: '2026-08-05',
        sens: 'envoye',
      },
    ],
  }
}
