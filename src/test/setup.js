import '@testing-library/jest-dom/vitest'

// jsdom ne fait pas persister le state entre les tests, mais le localStorage
// est partagé au sein du même processus : on le vide avant chaque test pour
// que le store parte toujours des données de seed.
afterEach(() => {
  localStorage.clear()
})
