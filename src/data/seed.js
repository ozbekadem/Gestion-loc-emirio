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
        statut: 'bon_payeur',
      },
      {
        id: loc2,
        bienId: b3,
        nom: 'Ahmed',
        prenom: 'Karim',
        email: 'karim.ahmed@example.com',
        telephone: '06 98 76 54 32',
        dateEntree: '2022-09-15',
        statut: 'retard',
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
      },
    ],
    paiements: [],
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
    ],
    candidatures: [],
    agenda: [],
  }
}
