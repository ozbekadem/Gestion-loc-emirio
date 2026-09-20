import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { renderHook } from '@testing-library/react'
import { useCrudModal } from './useCrudModal.js'

function fakeCollection() {
  return { add: vi.fn(), update: vi.fn() }
}

const emptyValues = { nom: '', ville: '', notes: '' }

describe('useCrudModal', () => {
  it('démarre fermé (modal === null)', () => {
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    expect(result.current.modal).toBeNull()
  })

  it('openNew() ouvre en mode création avec les valeurs par défaut', () => {
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    act(() => result.current.openNew())
    expect(result.current.modal).toEqual({ mode: 'create', values: emptyValues })
  })

  it('openNew(overrides) fusionne des valeurs initiales supplémentaires', () => {
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    act(() => result.current.openNew({ ville: 'Namur' }))
    expect(result.current.modal.values).toEqual({ nom: '', ville: 'Namur', notes: '' })
  })

  it('openEdit(item) ouvre en mode édition avec les valeurs de l\'item', () => {
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    act(() => result.current.openEdit({ id: 'x1', nom: 'Dupuis', ville: 'Namur' }))
    expect(result.current.modal.mode).toBe('edit')
    expect(result.current.modal.id).toBe('x1')
    expect(result.current.modal.values).toEqual({ id: 'x1', nom: 'Dupuis', ville: 'Namur', notes: '' })
  })

  it('openEdit complète les champs manquants d\'un enregistrement plus ancien avec emptyValues', () => {
    // Un enregistrement créé avant l'ajout du champ "notes" au schéma ne l'a pas :
    // le formulaire doit tout de même avoir un champ contrôlé (pas undefined).
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    act(() => result.current.openEdit({ id: 'x2', nom: 'Ancien' }))
    expect(result.current.modal.values.notes).toBe('')
  })

  it('field(key) met à jour uniquement la clé ciblée', () => {
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    act(() => result.current.openNew())
    act(() => result.current.field('nom')({ target: { value: 'Julie' } }))
    expect(result.current.modal.values).toEqual({ nom: 'Julie', ville: '', notes: '' })
  })

  it('setValues(objet) fusionne un patch partiel', () => {
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    act(() => result.current.openNew())
    act(() => result.current.setValues({ ville: 'Liège' }))
    expect(result.current.modal.values).toEqual({ nom: '', ville: 'Liège', notes: '' })
  })

  it('setValues(fonction) calcule le patch à partir des valeurs courantes', () => {
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    act(() => result.current.openNew({ nom: 'julie' }))
    act(() => result.current.setValues((v) => ({ nom: v.nom.toUpperCase() })))
    expect(result.current.modal.values.nom).toBe('JULIE')
    // Le reste des valeurs doit être conservé (fusion, pas remplacement).
    expect(result.current.modal.values.ville).toBe('')
  })

  it('close() referme la modale', () => {
    const { result } = renderHook(() => useCrudModal(fakeCollection(), emptyValues))
    act(() => result.current.openNew())
    act(() => result.current.close())
    expect(result.current.modal).toBeNull()
  })

  it('save() en mode création appelle collection.add avec les valeurs transformées', () => {
    const collection = fakeCollection()
    const transform = (v) => ({ ...v, ville: v.ville.trim() })
    const { result } = renderHook(() => useCrudModal(collection, emptyValues, transform))
    act(() => result.current.openNew({ nom: 'Dupuis', ville: '  Namur  ' }))
    act(() => result.current.save({ preventDefault: () => {} }))
    expect(collection.add).toHaveBeenCalledWith({ nom: 'Dupuis', ville: 'Namur', notes: '' })
    expect(collection.update).not.toHaveBeenCalled()
    expect(result.current.modal).toBeNull()
  })

  it('save() en mode édition appelle collection.update avec l\'id', () => {
    const collection = fakeCollection()
    const { result } = renderHook(() => useCrudModal(collection, emptyValues))
    act(() => result.current.openEdit({ id: 'x3', nom: 'Dupuis', ville: 'Namur' }))
    act(() => result.current.save())
    expect(collection.update).toHaveBeenCalledWith('x3', { id: 'x3', nom: 'Dupuis', ville: 'Namur', notes: '' })
    expect(collection.add).not.toHaveBeenCalled()
  })
})
