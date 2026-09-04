import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { makeId } from './id.js'
import { seedData } from '../data/seed.js'

const STORAGE_KEY = 'emirio-gestion-loc-data'

const COLLECTIONS = [
  'immeubles',
  'biens',
  'locataires',
  'baux',
  'paiements',
  'travaux',
  'prestataires',
  'candidatures',
  'agenda',
]

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const state = {}
      for (const c of COLLECTIONS) state[c] = Array.isArray(parsed[c]) ? parsed[c] : []
      return state
    }
  } catch {
    // ignore corrupted storage, fall back to seed
  }
  return seedData()
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const item = { id: makeId(), ...action.item }
      return { ...state, [action.collection]: [...state[action.collection], item] }
    }
    case 'UPDATE': {
      return {
        ...state,
        [action.collection]: state[action.collection].map((it) =>
          it.id === action.id ? { ...it, ...action.patch } : it,
        ),
      }
    }
    case 'REMOVE': {
      return {
        ...state,
        [action.collection]: state[action.collection].filter((it) => it.id !== action.id),
      }
    }
    case 'RESET_DEMO': {
      return seedData()
    }
    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const api = useMemo(() => {
    const actions = {}
    for (const c of COLLECTIONS) {
      actions[c] = {
        add: (item) => dispatch({ type: 'ADD', collection: c, item }),
        update: (id, patch) => dispatch({ type: 'UPDATE', collection: c, id, patch }),
        remove: (id) => dispatch({ type: 'REMOVE', collection: c, id }),
      }
    }
    actions.resetDemo = () => dispatch({ type: 'RESET_DEMO' })
    return actions
  }, [])

  const value = useMemo(() => ({ state, ...api }), [state, api])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore doit être utilisé dans un <StoreProvider>')
  return ctx
}
