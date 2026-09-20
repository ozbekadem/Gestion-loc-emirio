import { describe, expect, it, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders.jsx'
import Baux from './Baux.jsx'

const STORAGE_KEY = 'emirio-gestion-loc-data'

// Un bail avec un paiement et un état des lieux associés, pour vérifier que
// leur suppression est bien nettoyée en cascade (voir Baux.jsx `remove`).
function seedMinimalState() {
  const state = {
    immeubles: [{ id: 'im1', nom: 'Résidence Test' }],
    biens: [{ id: 'bien1', nom: 'Appt 1', immeubleId: 'im1' }],
    locataires: [{ id: 'loc1', prenom: 'Julie', nom: 'Dupuis', bienId: 'bien1' }],
    baux: [
      {
        id: 'bail1',
        locataireId: 'loc1',
        bienId: 'bien1',
        statut: 'actif',
        loyer: 600,
        charges: 50,
        dateDebut: '2024-01-01',
        dateFin: '2033-01-01',
        frequence: 'mensuel',
      },
    ],
    paiements: [
      { id: 'p1', bailId: 'bail1', mois: '2026-01', montantAttendu: 650, montantPaye: 650, statut: 'paye', fraisGestion: 50 },
      { id: 'p2', bailId: 'bail1', mois: '2026-02', montantAttendu: 650, montantPaye: 650, statut: 'paye', fraisGestion: 50 },
    ],
    etatsDesLieux: [
      { id: 'edl1', bailId: 'bail1', type: 'entree', date: '2024-01-01', pieces: [], compteurs: {}, nombreCles: 2, observations: '' },
    ],
    travaux: [],
    prestataires: [],
    candidatures: [],
    agenda: [],
    sinistres: [],
    messages: [],
    documents: [],
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

describe('Baux — suppression d\'un bail (pas d\'enregistrements orphelins)', () => {
  beforeEach(() => {
    seedMinimalState()
  })

  it('supprime le bail ainsi que ses paiements et états des lieux associés', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Baux />)

    expect(screen.getByText('Julie Dupuis')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Suppr.' }))

    // La boîte de dialogue de confirmation (in-app, plus de window.confirm) affiche
    // le nombre de paiements qui seront supprimés avec le bail.
    expect(await screen.findByText(/2 paiements/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmer' }))

    expect(screen.queryByText('Julie Dupuis')).not.toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.baux).toHaveLength(0)
    // Avant le correctif, ces paiements restaient orphelins (bailId pointant
    // vers un bail supprimé) et continuaient à être comptés dans les
    // reversements et la comptabilité, invisibles depuis l'interface.
    expect(stored.paiements).toHaveLength(0)
    expect(stored.etatsDesLieux).toHaveLength(0)
  })

  it("n'affecte pas les paiements d'un autre bail", async () => {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY))
    state.baux.push({
      id: 'bail2', locataireId: 'loc1', bienId: 'bien1', statut: 'termine',
      loyer: 500, charges: 40, dateDebut: '2020-01-01', dateFin: '2023-01-01', frequence: 'mensuel',
    })
    state.paiements.push({ id: 'p3', bailId: 'bail2', mois: '2022-01', montantAttendu: 540, montantPaye: 540, statut: 'paye', fraisGestion: 40 })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

    const user = userEvent.setup()
    renderWithProviders(<Baux />)

    await user.click(screen.getAllByRole('button', { name: 'Suppr.' })[0])
    await user.click(await screen.findByRole('button', { name: 'Confirmer' }))

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.baux).toHaveLength(1)
    expect(stored.baux[0].id).toBe('bail2')
    expect(stored.paiements).toHaveLength(1)
    expect(stored.paiements[0].id).toBe('p3')
  })

  it('ne supprime rien si la confirmation est annulée', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Baux />)

    await user.click(screen.getByRole('button', { name: 'Suppr.' }))
    await user.click(await screen.findByRole('button', { name: 'Annuler' }))

    expect(screen.getByText('Julie Dupuis')).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.baux).toHaveLength(1)
    expect(stored.paiements).toHaveLength(2)
  })
})
