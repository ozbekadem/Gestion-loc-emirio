import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoreProvider } from '../lib/store.jsx'
import GrillePaiements from './GrillePaiements.jsx'

const STORAGE_KEY = 'emirio-gestion-loc-data'

// Un seul bail actif, sans historique de paiement : état déterministe pour
// tester le flux "enregistrer un loyer perçu" indépendamment des données de
// démonstration (générées aléatoirement et dépendantes de la date du jour).
function seedMinimalState() {
  const state = {
    immeubles: [{ id: 'im1', nom: 'Résidence Test' }],
    biens: [{ id: 'bien1', nom: 'Appt 1', immeubleId: 'im1' }],
    locataires: [{ id: 'loc1', prenom: 'Julie', nom: 'Dupuis' }],
    baux: [
      {
        id: 'bail1',
        locataireId: 'loc1',
        bienId: 'bien1',
        statut: 'actif',
        loyer: 600,
        charges: 50,
        fraisGestion: 60,
      },
    ],
    paiements: [],
    travaux: [],
    prestataires: [],
    candidatures: [],
    agenda: [],
    sinistres: [],
    messages: [],
    documents: [],
    etatsDesLieux: [],
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

describe('GrillePaiements — flux "enregistrer un loyer perçu"', () => {
  beforeEach(() => {
    seedMinimalState()
  })

  it('affiche le locataire du bail actif avec ses 12 échéances "Attendu"', () => {
    render(
      <StoreProvider>
        <GrillePaiements />
      </StoreProvider>,
    )
    expect(screen.getByText('Julie Dupuis')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'A' })).toHaveLength(12)
  })

  it('enregistre un paiement via la modale : la cellule et le store sont mis à jour', async () => {
    const user = userEvent.setup()
    render(
      <StoreProvider>
        <GrillePaiements />
      </StoreProvider>,
    )

    // Ouvre la cellule de janvier (première colonne de mois) pour le bail unique.
    const celluleJanvier = screen.getAllByRole('button', { name: 'A' })[0]
    await user.click(celluleJanvier)

    expect(await screen.findByText(/Julie Dupuis — Janvier/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Statut'), 'paye')
    // Le montant est pré-rempli avec le loyer + charges attendus (600 + 50).
    expect(screen.getByLabelText('Montant payé (€)')).toHaveValue(650)

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    // La modale se ferme et la cellule affiche désormais le montant perçu.
    expect(screen.queryByText(/Julie Dupuis — Janvier/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /650/ })).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.paiements).toHaveLength(1)
    expect(stored.paiements[0]).toMatchObject({
      bailId: 'bail1',
      statut: 'paye',
      montantPaye: 650,
      fraisGestion: 60,
    })
  })

  it('la sélection "Attendu" supprime un paiement existant plutôt que de l\'enregistrer vide', async () => {
    const user = userEvent.setup()
    render(
      <StoreProvider>
        <GrillePaiements />
      </StoreProvider>,
    )

    // Enregistre d'abord un paiement pour janvier.
    await user.click(screen.getAllByRole('button', { name: 'A' })[0])
    await user.selectOptions(screen.getByLabelText('Statut'), 'paye')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).paiements).toHaveLength(1)

    // Ré-ouvre la même cellule (elle affiche désormais le montant, pas "A") et repasse à "Attendu".
    await user.click(screen.getByRole('button', { name: /650/ }))
    await user.selectOptions(screen.getByLabelText('Statut'), 'attendu')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).paiements).toHaveLength(0)
    expect(screen.getAllByRole('button', { name: 'A' })).toHaveLength(12)
  })
})
