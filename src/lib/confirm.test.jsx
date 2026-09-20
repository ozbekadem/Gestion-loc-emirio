import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider, useConfirm } from './confirm.jsx'

function Demo() {
  const confirm = useConfirm()
  const [result, setResult] = React.useState(null)

  async function ask() {
    const ok = await confirm('Supprimer cet élément ?', { danger: true })
    setResult(ok)
  }
  async function notify() {
    await confirm('Action impossible.', { okOnly: true })
    setResult('notified')
  }

  return (
    <div>
      <button onClick={ask}>Demander</button>
      <button onClick={notify}>Notifier</button>
      <p>Résultat : {result === null ? 'aucun' : String(result)}</p>
    </div>
  )
}

describe('ConfirmProvider / useConfirm', () => {
  it('résout true quand on clique sur Confirmer', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <Demo />
      </ConfirmProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Demander' }))
    expect(await screen.findByText('Supprimer cet élément ?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirmer' }))

    expect(screen.getByText('Résultat : true')).toBeInTheDocument()
    expect(screen.queryByText('Supprimer cet élément ?')).not.toBeInTheDocument()
  })

  it('résout false quand on clique sur Annuler', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <Demo />
      </ConfirmProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Demander' }))
    await user.click(await screen.findByRole('button', { name: 'Annuler' }))

    expect(screen.getByText('Résultat : false')).toBeInTheDocument()
  })

  it('résout false quand on ferme la boîte sans répondre (croix / clic extérieur)', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <Demo />
      </ConfirmProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Demander' }))
    await screen.findByText('Supprimer cet élément ?')
    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(screen.getByText('Résultat : false')).toBeInTheDocument()
  })

  it('mode okOnly (alerte) : un seul bouton, résout toujours true', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmProvider>
        <Demo />
      </ConfirmProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Notifier' }))
    expect(await screen.findByText('Action impossible.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(screen.getByText('Résultat : notified')).toBeInTheDocument()
  })

  it('useConfirm() lève une erreur explicite hors ConfirmProvider', () => {
    function Orphan() {
      useConfirm()
      return null
    }
    // React logue une erreur dans la console pour ce throw attendu ; on l'étouffe pour ce test.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Orphan />)).toThrow('useConfirm doit être utilisé dans un <ConfirmProvider>')
    consoleError.mockRestore()
  })
})
