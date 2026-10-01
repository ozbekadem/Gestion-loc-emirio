import { describe, expect, it } from 'vitest'
import {
  formatMontant,
  formatDate,
  moisCourant,
  labelMois,
  moisDecale,
  immeubleDuBail,
  anneesDisponibles,
  agregerPaiementsPeriode,
  dernierMoisProbleme,
  createStatutLookup,
  statutPaiementInfo,
  calculerStatutPaiement,
  statutLocataireInfo,
  montantAReverser,
  statutReversement,
  lienWhatsapp,
  lienEmail,
  texteRappelLoyer,
} from './utils.js'

// Selon l'environnement ICU, Intl.NumberFormat sépare les milliers et la
// devise par des espaces insécables ( ,  ) plutôt que des espaces
// normales : on normalise avant de comparer pour ne pas dépendre de la
// plateforme d'exécution.
function sansEspacesInsecables(s) {
  return s.replace(/[  ]/g, ' ')
}

describe('formatMontant', () => {
  it('formate un nombre en euros (fr-FR, sans décimales)', () => {
    expect(sansEspacesInsecables(formatMontant(1200))).toBe('1 200 €')
  })

  it('traite les valeurs manquantes ou invalides comme 0', () => {
    expect(sansEspacesInsecables(formatMontant(undefined))).toBe('0 €')
    expect(sansEspacesInsecables(formatMontant(null))).toBe('0 €')
    expect(sansEspacesInsecables(formatMontant('pas un nombre'))).toBe('0 €')
  })

  it('convertit les chaînes numériques', () => {
    expect(sansEspacesInsecables(formatMontant('750'))).toBe('750 €')
  })
})

describe('formatDate', () => {
  it('formate une date ISO au format fr-FR', () => {
    expect(formatDate('2026-03-15')).toBe('15/03/2026')
  })

  it("retourne un tiret cadratin pour une valeur vide ou invalide", () => {
    expect(formatDate('')).toBe('—')
    expect(formatDate(null)).toBe('—')
    expect(formatDate('pas-une-date')).toBe('—')
  })
})

describe('moisCourant', () => {
  it('retourne le mois courant au format AAAA-MM', () => {
    expect(moisCourant()).toMatch(/^\d{4}-\d{2}$/)
  })
})

describe('labelMois', () => {
  it('convertit une clé de mois en libellé français', () => {
    expect(labelMois('2026-01')).toBe('Janvier 2026')
    expect(labelMois('2026-12')).toBe('Décembre 2026')
  })
})

describe('moisDecale', () => {
  it('avance ou recule une clé de mois du delta demandé', () => {
    expect(moisDecale('2026-01', 1)).toBe('2026-02')
    expect(moisDecale('2026-01', -1)).toBe('2025-12')
    expect(moisDecale('2026-06', 6)).toBe('2026-12')
  })

  it('gère le changement d\'année dans les deux sens', () => {
    expect(moisDecale('2026-12', 1)).toBe('2027-01')
    expect(moisDecale('2026-01', -12)).toBe('2025-01')
  })
})

describe('immeubleDuBail', () => {
  const state = {
    baux: [{ id: 'bail1', bienId: 'bien1' }, { id: 'bail2', bienId: 'inexistant' }],
    biens: [{ id: 'bien1', immeubleId: 'im1' }],
  }

  it('remonte du bail au bien puis à l\'immeuble', () => {
    expect(immeubleDuBail(state, 'bail1')).toBe('im1')
  })

  it('retourne null si le bail est introuvable', () => {
    expect(immeubleDuBail(state, 'bail-inexistant')).toBeNull()
  })

  it('retourne null si le bien référencé par le bail est introuvable', () => {
    expect(immeubleDuBail(state, 'bail2')).toBeNull()
  })
})

describe('createStatutLookup', () => {
  const list = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
  ]

  it('retrouve un élément connu par sa valeur', () => {
    const lookup = createStatutLookup(list)
    expect(lookup('b').label).toBe('B')
  })

  it("retombe sur l'élément à l'index de repli pour une valeur inconnue ou absente", () => {
    const lookup = createStatutLookup(list, 2)
    expect(lookup('inexistant').label).toBe('C')
    expect(lookup(undefined).label).toBe('C')
  })

  it('utilise le premier élément comme repli par défaut', () => {
    const lookup = createStatutLookup(list)
    expect(lookup('inexistant').label).toBe('A')
  })
})

describe('calculerStatutPaiement', () => {
  it('retourne "retard" si rien n\'a été payé', () => {
    expect(calculerStatutPaiement(0, 800)).toBe('retard')
    expect(calculerStatutPaiement(undefined, 800)).toBe('retard')
    expect(calculerStatutPaiement(-10, 800)).toBe('retard')
  })

  it('retourne "partiel" si le montant payé est inférieur au montant attendu', () => {
    expect(calculerStatutPaiement(400, 800)).toBe('partiel')
  })

  it('retourne "paye" si le montant payé atteint ou dépasse le montant attendu', () => {
    expect(calculerStatutPaiement(800, 800)).toBe('paye')
    expect(calculerStatutPaiement(900, 800)).toBe('paye')
  })
})

describe('anneesDisponibles', () => {
  it('inclut toujours l\'année courante', () => {
    expect(anneesDisponibles([], [])).toContain(new Date().getFullYear())
  })

  it("couvre les dates de début/fin de bail et les mois de paiement", () => {
    const annees = anneesDisponibles(
      [{ dateDebut: '2022-03-01', dateFin: '2024-02-28' }],
      [{ mois: '2023-11' }],
    )
    expect(annees).toContain(2022)
    expect(annees).toContain(2024)
    expect(annees).toContain(2023)
  })

  it('trie du plus récent au plus ancien', () => {
    const annees = anneesDisponibles([{ dateDebut: '2020-01-01' }], [])
    expect(annees).toEqual([...annees].sort((a, b) => b - a))
  })
})

describe('agregerPaiementsPeriode', () => {
  it('additionne attendu et encaissé sur les mois fournis', () => {
    const paiements = {
      '2026-06': { statut: 'paye', montantPaye: 820 },
      '2026-08': { statut: 'paye', montantPaye: 820 },
      '2026-09': { statut: 'paye', montantPaye: 820 },
    }
    const r = agregerPaiementsPeriode(820, paiements, ['2026-06', '2026-07', '2026-08', '2026-09'])
    expect(r.totalAttendu).toBe(3280)
    expect(r.totalEncaisse).toBe(2460)
    expect(r.pct).toBe(75)
  })

  it('signale hasRetard pour un paiement explicitement en retard', () => {
    const r = agregerPaiementsPeriode(800, { '2026-07': { statut: 'retard' } }, ['2026-07'])
    expect(r.hasRetard).toBe(true)
    expect(r.totalEncaisse).toBe(0)
  })

  it('signale hasManque pour un mois sans paiement saisi ou un paiement partiel', () => {
    const sansSaisie = agregerPaiementsPeriode(800, {}, ['2026-07'])
    expect(sansSaisie.hasManque).toBe(true)
    expect(sansSaisie.hasRetard).toBe(false)

    const partiel = agregerPaiementsPeriode(800, { '2026-07': { statut: 'partiel', montantPaye: 400 } }, ['2026-07'])
    expect(partiel.hasManque).toBe(true)
    expect(partiel.totalEncaisse).toBe(400)
  })

  it('retourne pct null quand aucun mois n\'est fourni (rien n\'est encore dû)', () => {
    expect(agregerPaiementsPeriode(800, {}, []).pct).toBeNull()
  })

  it('retourne 100% quand tout est payé', () => {
    const paiements = { '2026-06': { statut: 'paye', montantPaye: 700 } }
    expect(agregerPaiementsPeriode(700, paiements, ['2026-06']).pct).toBe(100)
  })
})

describe('dernierMoisProbleme', () => {
  it('retourne le mois le plus récent sans paiement saisi', () => {
    const mois = dernierMoisProbleme({ '2026-06': { statut: 'paye' } }, ['2026-06', '2026-07', '2026-08'])
    expect(mois).toBe('2026-08')
  })

  it('retourne le mois le plus récent en retard ou partiel, même si des mois plus récents sont payés', () => {
    const paiements = {
      '2026-06': { statut: 'paye' },
      '2026-07': { statut: 'retard' },
      '2026-08': { statut: 'paye' },
    }
    expect(dernierMoisProbleme(paiements, ['2026-06', '2026-07', '2026-08'])).toBe('2026-07')
  })

  it('retourne null quand tout est payé', () => {
    const paiements = { '2026-06': { statut: 'paye' }, '2026-07': { statut: 'paye' } }
    expect(dernierMoisProbleme(paiements, ['2026-06', '2026-07'])).toBeNull()
  })
})

describe('statutPaiementInfo', () => {
  it('retrouve les métadonnées associées à un statut connu', () => {
    expect(statutPaiementInfo('paye').label).toBe('Payé')
    expect(statutPaiementInfo('retard').tone).toBe('red')
  })

  it("retombe sur le statut 'attendu' pour une valeur inconnue", () => {
    expect(statutPaiementInfo('inexistant').value).toBe('attendu')
    expect(statutPaiementInfo(undefined).value).toBe('attendu')
  })
})

describe('statutLocataireInfo', () => {
  it('retrouve les métadonnées associées à un statut connu', () => {
    expect(statutLocataireInfo('excellent_payeur').label).toBe('Excellent payeur')
    expect(statutLocataireInfo('mauvais_payeur').tone).toBe('red')
  })

  it("retombe sur le statut 'nouveau' pour une valeur inconnue ou absente", () => {
    expect(statutLocataireInfo('inexistant').value).toBe('nouveau')
    expect(statutLocataireInfo(undefined).value).toBe('nouveau')
  })
})

describe('montantAReverser', () => {
  it('déduit les frais de gestion du montant perçu', () => {
    expect(montantAReverser({ montantPaye: 800, fraisGestion: 80 })).toBe(720)
  })

  it('ne descend jamais sous zéro même si les frais dépassent le montant perçu', () => {
    expect(montantAReverser({ montantPaye: 50, fraisGestion: 200 })).toBe(0)
  })

  it('gère un paiement sans montants renseignés', () => {
    expect(montantAReverser({})).toBe(0)
    expect(montantAReverser(undefined)).toBe(0)
  })
})

describe('statutReversement', () => {
  it('retourne null si le loyer n\'a pas été perçu', () => {
    expect(statutReversement({ statut: 'attendu' })).toBeNull()
    expect(statutReversement({ statut: 'retard' })).toBeNull()
  })

  it("indique 'a_reverser' pour un paiement perçu sans date de reversement", () => {
    expect(statutReversement({ statut: 'paye' })).toBe('a_reverser')
    expect(statutReversement({ statut: 'partiel' })).toBe('a_reverser')
  })

  it("indique 'reverse' une fois la date de reversement renseignée", () => {
    expect(statutReversement({ statut: 'paye', dateReversement: '2026-01-05' })).toBe('reverse')
  })
})

describe('lienWhatsapp', () => {
  it('convertit un numéro belge commençant par 0 au format international', () => {
    const lien = lienWhatsapp('0475 11 22 33', 'Bonjour')
    expect(lien).toBe('https://wa.me/32475112233?text=Bonjour')
  })

  it('conserve un numéro déjà au format international (+32...)', () => {
    const lien = lienWhatsapp('+32 475 11 22 33', 'Bonjour')
    expect(lien).toBe('https://wa.me/32475112233?text=Bonjour')
  })

  it('normalise un préfixe international "00"', () => {
    const lien = lienWhatsapp('0032475112233', 'Bonjour')
    expect(lien).toBe('https://wa.me/32475112233?text=Bonjour')
  })

  it('encode le message dans la query string', () => {
    const lien = lienWhatsapp('0475112233', 'Rendez-vous à 10h ?')
    expect(lien).toContain(encodeURIComponent('Rendez-vous à 10h ?'))
  })

  it('gère un numéro manquant sans lever d\'exception', () => {
    expect(() => lienWhatsapp(undefined, 'Bonjour')).not.toThrow()
  })
})

describe('lienEmail', () => {
  it('construit un lien mailto avec sujet et corps encodés', () => {
    const lien = lienEmail('proprietaire@example.com', 'Loyer de mars', 'Bonjour, voici le récapitulatif.')
    expect(lien).toBe(
      'mailto:proprietaire@example.com?subject=' +
        encodeURIComponent('Loyer de mars') +
        '&body=' +
        encodeURIComponent('Bonjour, voici le récapitulatif.'),
    )
  })
})

describe('texteRappelLoyer', () => {
  it('inclut le prénom du locataire et le montant formaté', () => {
    const texte = texteRappelLoyer({ prenom: 'Julie' }, 650, 'Septembre 2026')
    expect(texte).toContain('Bonjour Julie,')
    expect(texte).toContain('Septembre 2026')
    expect(sansEspacesInsecables(texte)).toContain('650 €')
  })
})
