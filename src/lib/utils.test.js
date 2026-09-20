import { describe, expect, it } from 'vitest'
import {
  formatMontant,
  formatDate,
  moisCourant,
  labelMois,
  statutPaiementInfo,
  montantAReverser,
  statutReversement,
  lienWhatsapp,
  lienEmail,
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
