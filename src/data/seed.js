import { makeId } from '../lib/id.js'

const IMMEUBLES = [
  { nom: 'Résidence Le Parc', adresse: '15 rue du Parc', codePostal: '6000', ville: 'Charleroi', type: 'Immeuble résidentiel', proprietaireNom: 'Jean Ozbek', proprietaireEmail: 'jean.ozbek@example.com', proprietaireTelephone: '0475 11 22 33' },
  { nom: 'Résidence Les Acacias', adresse: '42 rue des Acacias', codePostal: '6040', ville: 'Jumet', type: 'Immeuble résidentiel', proprietaireNom: 'Jean Ozbek', proprietaireEmail: 'jean.ozbek@example.com', proprietaireTelephone: '0475 11 22 33' },
  { nom: 'Immeuble Central', adresse: '8 place Communale', codePostal: '6001', ville: 'Marcinelle', type: 'Immeuble mixte', proprietaireNom: 'SPRL Immo Renard', proprietaireEmail: 'gestion@immo-renard.be', proprietaireTelephone: '071 22 33 44' },
  { nom: 'Résidence Bellevue', adresse: '23 avenue Bellevue', codePostal: '6060', ville: 'Gilly', type: 'Immeuble résidentiel', proprietaireNom: '', proprietaireEmail: '', proprietaireTelephone: '' },
  { nom: 'Le Clos Fleuri', adresse: '5 rue des Fleurs', codePostal: '5000', ville: 'Namur', type: 'Immeuble résidentiel', proprietaireNom: 'Michel Faure', proprietaireEmail: 'michel.faure@example.com', proprietaireTelephone: '081 55 66 77' },
]

const LOCATAIRES_NOMS = [
  ['Sophie', 'Bernard'], ['Karim', 'Ahmed'], ['Julie', 'Dupuis'], ['Marc', 'Lambert'],
  ['Nadia', 'Renard'], ['Thomas', 'Martin'], ['Claire', 'Dubois'], ['Ahmed', 'Nasser'],
  ['Élise', 'Michel'], ['Paul', 'Simon'], ['Camille', 'Petit'], ['Luc', 'Moreau'],
  ['Sarah', 'Leroy'], ['David', 'Rousseau'], ['Emma', 'Girard'], ['Nicolas', 'Fontaine'],
  ['Léa', 'Mercier'], ['Antoine', 'Roche'], ['Marie', 'Faure'], ['Julien', 'Blanc'],
]

const STATUTS_LOCATAIRE = ['excellent_payeur', 'bon_payeur', 'bon_payeur', 'mauvais_payeur']
// Index (0-19) des locataires ayant un incident de paiement récent, pour un jeu de données réaliste
const LOCATAIRES_EN_RETARD = new Set([7, 13])
const LOCATAIRES_PARTIEL = new Set([1])
const LOCATAIRE_NOUVEAU = 19

const ETAGES = ['RDC', '1er étage', '2e étage', '3e étage']

const PIECES_ETAT_DES_LIEUX = ['Entrée', 'Séjour', 'Cuisine', 'Chambre 1', 'Chambre 2', 'Salle de bain', 'WC']

// Vignette de démonstration (spécimen fictif, aucune donnée personnelle réelle)
const SPECIMEN_CARTE_IDENTITE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="340" height="216">
      <rect width="340" height="216" rx="12" fill="#1f2c6b"/>
      <rect x="12" y="12" width="90" height="110" rx="6" fill="#3a63f5"/>
      <text x="57" y="72" font-family="Arial" font-size="12" fill="#eef4ff" text-anchor="middle">PHOTO</text>
      <text x="116" y="40" font-family="Arial" font-size="16" fill="white" font-weight="bold">CARTE D'IDENTITÉ</text>
      <text x="116" y="70" font-family="Arial" font-size="13" fill="#d9e6ff">SPÉCIMEN — exemple</text>
      <text x="116" y="95" font-family="Arial" font-size="12" fill="#d9e6ff">Document de démonstration</text>
      <text x="116" y="115" font-family="Arial" font-size="12" fill="#d9e6ff">non lié à une vraie personne</text>
    </svg>
  `)

function moisKey(annee, mois) {
  return `${annee}-${String(mois).padStart(2, '0')}`
}

export function seedData() {
  const immeubles = IMMEUBLES.map((im) => ({ id: makeId(), ...im }))
  const biens = []
  const locataires = []
  const baux = []
  const paiements = []
  const documents = []
  const etatsDesLieux = []

  IMMEUBLES.forEach((_, immIndex) => {
    const immeubleId = immeubles[immIndex].id
    for (let unite = 0; unite < 4; unite += 1) {
      const locIndex = immIndex * 4 + unite
      const [prenom, nom] = LOCATAIRES_NOMS[locIndex]
      const surface = 45 + unite * 12
      const loyerBase = 620 + immIndex * 40 + unite * 45
      const charges = 60 + unite * 10

      const bienId = makeId()
      biens.push({
        id: bienId,
        immeubleId,
        nom: `Appartement ${unite + 1}`,
        etage: ETAGES[unite],
        surface,
        loyerBase,
        charges,
      })

      const estNouveau = locIndex === LOCATAIRE_NOUVEAU
      const anneeEntree = 2022 + (locIndex % 4)
      const moisEntree = 1 + (locIndex % 12)
      const dateEntree = estNouveau ? '2026-09-01' : `${anneeEntree}-${String(moisEntree).padStart(2, '0')}-01`
      const locataireId = makeId()
      locataires.push({
        id: locataireId,
        bienId,
        nom,
        prenom,
        email: `${prenom.toLowerCase().replace('é', 'e')}.${nom.toLowerCase()}@example.com`,
        telephone: `04${70 + locIndex} ${10 + locIndex} ${20 + locIndex} ${30 + locIndex}`,
        dateEntree,
        statut: estNouveau ? 'nouveau' : STATUTS_LOCATAIRE[unite],
      })

      const bailId = makeId()
      const loyerInitial = loyerBase - 30
      baux.push({
        id: bailId,
        locataireId,
        bienId,
        dateDebut: dateEntree,
        // Bail de résidence principale belge standard : 9 ans
        dateFin: `${Number(dateEntree.slice(0, 4)) + 9}-${dateEntree.slice(5)}`,
        loyer: loyerBase,
        charges,
        depotGarantie: loyerBase * 2,
        statut: 'actif',
        frequence: 'mensuel',
        loyerInitial,
        indiceInitial: 118 + (locIndex % 5),
        indiceActuel: 128.9,
        dateIndexation: `2026-${String((locIndex % 9) + 1).padStart(2, '0')}-01`,
      })

      if (!estNouveau) {
        for (let mois = 1; mois <= 8; mois += 1) {
          const cle = moisKey(2026, mois)
          let statut = 'paye'
          if (LOCATAIRES_EN_RETARD.has(locIndex) && mois >= 7) statut = 'retard'
          else if (LOCATAIRES_PARTIEL.has(locIndex) && mois === 6) statut = 'partiel'
          const montantAttendu = loyerBase + charges
          paiements.push({
            id: makeId(),
            bailId,
            mois: cle,
            montantAttendu,
            montantPaye: statut === 'paye' ? montantAttendu : statut === 'partiel' ? Math.round(montantAttendu * 0.5) : 0,
            datePaiement: statut === 'retard' ? '' : `${cle}-05`,
            statut,
          })
        }
      }

      // Dossier locataire complet pour le tout premier exemple (Sophie Bernard)
      if (locIndex === 0) {
        documents.push({
          id: makeId(),
          locataireId,
          bailId,
          type: 'carte_identite',
          nom: 'carte-identite-specimen.svg',
          mime: 'image/svg+xml',
          dataUrl: SPECIMEN_CARTE_IDENTITE,
          dateAjout: dateEntree,
        })
        etatsDesLieux.push({
          id: makeId(),
          bailId,
          type: 'entree',
          date: dateEntree,
          pieces: PIECES_ETAT_DES_LIEUX.map((nom, i) => ({
            nom,
            etat: i === 2 ? 'moyen' : 'bon',
            commentaire: i === 2 ? 'Légère trace d\'usure sur le plan de travail' : '',
          })),
          compteurs: { electricite: '012480', eau: '00845', gaz: '00312' },
          nombreCles: 3,
          observations: 'Logement en bon état général à l\'entrée du locataire.',
        })
      }
    }
  })

  const prestCarreleurId = makeId()
  const prestAssuranceId = makeId()

  return {
    immeubles,
    biens,
    locataires,
    baux,
    paiements,
    travaux: [
      {
        id: makeId(),
        immeubleId: immeubles[0].id,
        bienId: biens[1].id,
        titre: 'Remplacement carrelage salle de bain',
        description: 'Carrelage endommagé à remplacer',
        prestataireId: prestCarreleurId,
        statut: 'en_cours',
        cout: 850,
        date: '2026-08-20',
        categorie: 'Plomberie',
        urgence: 'normale',
      },
    ],
    prestataires: [
      {
        id: prestCarreleurId,
        nom: 'Dupont Carrelage',
        metier: 'Carreleur',
        telephone: '071 23 45 67',
        email: 'contact@dupont-carrelage.be',
        adresse: 'Charleroi',
      },
      {
        id: prestAssuranceId,
        nom: 'Assurances Provinces Réunies',
        metier: "Compagnie d'assurance",
        telephone: '081 98 76 54',
        email: 'sinistres@apr-assurances.be',
        adresse: 'Namur',
      },
    ],
    candidatures: [],
    agenda: [],
    sinistres: [
      {
        id: makeId(),
        immeubleId: immeubles[4].id,
        bienId: biens[biens.length - 1].id,
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
        locataireId: locataires[7].id,
        destinataire: 'locataire',
        canal: 'email',
        sujet: 'Rappel de loyer — Juillet 2026',
        contenu: `Bonjour ${locataires[7].prenom}, nous n'avons pas encore reçu le paiement du loyer de juillet. Merci de régulariser dans les meilleurs délais.`,
        date: '2026-08-05',
        sens: 'envoye',
      },
    ],
    documents,
    etatsDesLieux,
  }
}
