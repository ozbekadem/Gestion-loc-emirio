import React from 'react'
import { render } from '@testing-library/react'
import { StoreProvider } from '../lib/store.jsx'
import { ConfirmProvider } from '../lib/confirm.jsx'

// Enveloppe un composant avec les mêmes providers que main.jsx (state global +
// boîte de dialogue de confirmation), pour que les tests de pages n'aient pas
// à répéter cet arrangement à chaque fichier.
export function renderWithProviders(ui) {
  return render(
    <StoreProvider>
      <ConfirmProvider>{ui}</ConfirmProvider>
    </StoreProvider>,
  )
}
