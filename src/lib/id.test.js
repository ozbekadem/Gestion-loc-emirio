import { describe, expect, it } from 'vitest'
import { makeId } from './id.js'

describe('makeId', () => {
  it('génère une chaîne non vide', () => {
    const id = makeId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('génère des identifiants différents à chaque appel', () => {
    const ids = new Set(Array.from({ length: 200 }, () => makeId()))
    expect(ids.size).toBe(200)
  })
})
