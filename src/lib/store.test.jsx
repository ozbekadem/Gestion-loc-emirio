import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { renderHook } from '@testing-library/react'
import { StoreProvider, useStore } from './store.jsx'

const STORAGE_KEY = 'emirio-gestion-loc-data'

function renderStore() {
  return renderHook(() => useStore(), { wrapper: StoreProvider })
}

describe('StoreProvider / useStore', () => {
  it('charge des données de démonstration au premier rendu (localStorage vide)', () => {
    const { result } = renderStore()
    expect(result.current.state.immeubles.length).toBeGreaterThan(0)
    expect(result.current.state.locataires.length).toBeGreaterThan(0)
  })

  it('ajoute un élément à une collection et lui attribue un id', () => {
    const { result } = renderStore()
    const avant = result.current.state.immeubles.length

    act(() => {
      result.current.immeubles.add({ nom: 'Nouvel immeuble' })
    })

    expect(result.current.state.immeubles).toHaveLength(avant + 1)
    const ajoute = result.current.state.immeubles.at(-1)
    expect(ajoute.nom).toBe('Nouvel immeuble')
    expect(ajoute.id).toBeTruthy()
  })

  it('met à jour un élément existant sans affecter les autres champs', () => {
    const { result } = renderStore()

    act(() => {
      result.current.immeubles.add({ nom: 'Avant', ville: 'Namur' })
    })
    const id = result.current.state.immeubles.at(-1).id

    act(() => {
      result.current.immeubles.update(id, { nom: 'Après' })
    })

    const item = result.current.state.immeubles.find((i) => i.id === id)
    expect(item.nom).toBe('Après')
    expect(item.ville).toBe('Namur')
  })

  it('supprime un élément de la collection', () => {
    const { result } = renderStore()

    act(() => {
      result.current.immeubles.add({ nom: 'À supprimer' })
    })
    const id = result.current.state.immeubles.at(-1).id
    const avant = result.current.state.immeubles.length

    act(() => {
      result.current.immeubles.remove(id)
    })

    expect(result.current.state.immeubles).toHaveLength(avant - 1)
    expect(result.current.state.immeubles.find((i) => i.id === id)).toBeUndefined()
  })

  it('persiste automatiquement le state dans le localStorage', () => {
    const { result } = renderStore()

    act(() => {
      result.current.immeubles.add({ nom: 'Persisté' })
    })

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw)
    expect(parsed.immeubles.some((i) => i.nom === 'Persisté')).toBe(true)
  })

  it('recharge le state persisté au montage suivant (au lieu de reseeder)', () => {
    const first = renderStore()
    act(() => {
      first.result.current.immeubles.add({ nom: 'Doit survivre' })
    })
    const totalApresAjout = first.result.current.state.immeubles.length

    const second = renderStore()
    expect(second.result.current.state.immeubles).toHaveLength(totalApresAjout)
    expect(second.result.current.state.immeubles.some((i) => i.nom === 'Doit survivre')).toBe(true)
  })

  it('resetDemo régénère un jeu de données de démonstration et écrase les modifications', () => {
    const { result } = renderStore()

    act(() => {
      result.current.immeubles.add({ nom: 'Temporaire' })
    })
    act(() => {
      result.current.resetDemo()
    })

    expect(result.current.state.immeubles.some((i) => i.nom === 'Temporaire')).toBe(false)
    expect(result.current.state.immeubles.length).toBeGreaterThan(0)
  })

  it('importState remplace uniquement les collections fournies', () => {
    const { result } = renderStore()
    const paiementsAvant = result.current.state.paiements

    act(() => {
      result.current.importState({ immeubles: [{ id: 'x1', nom: 'Importé' }] })
    })

    expect(result.current.state.immeubles).toEqual([{ id: 'x1', nom: 'Importé' }])
    // "paiements" n'était pas dans les données importées : la collection existante est conservée.
    expect(result.current.state.paiements).toEqual(paiementsAvant)
  })

  it('lève une erreur explicite si useStore est utilisé hors StoreProvider', () => {
    // React logue une erreur dans la console pour ce throw attendu ; on l'étouffe pour ce test.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useStore())).toThrow('useStore doit être utilisé dans un <StoreProvider>')
    consoleError.mockRestore()
  })
})
