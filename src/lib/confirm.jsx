import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Modal, Button } from '../components/ui.jsx'

const ConfirmContext = createContext(null)

/**
 * Remplace window.confirm()/window.alert() par une boîte de dialogue stylée,
 * cohérente avec le reste de l'application (les alertes natives du
 * navigateur bloquent le fil d'exécution et ne peuvent pas être habillées).
 *
 * Rendue une seule fois au sommet de l'app (voir main.jsx) : chaque page
 * appelle `useConfirm()` et attend la réponse de l'utilisateur.
 */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolveRef = useRef(null)

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setRequest({ message, ...options })
    })
  }, [])

  function respond(result) {
    resolveRef.current?.(result)
    resolveRef.current = null
    setRequest(null)
  }

  const okOnly = !!request?.okOnly

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!request}
        onClose={() => respond(false)}
        title={request?.title || (okOnly ? 'Information' : 'Confirmation')}
        footer={
          okOnly ? (
            <Button onClick={() => respond(true)}>{request?.okLabel || 'OK'}</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => respond(false)}>{request?.cancelLabel || 'Annuler'}</Button>
              <Button variant={request?.danger ? 'danger' : 'primary'} onClick={() => respond(true)}>
                {request?.confirmLabel || 'Confirmer'}
              </Button>
            </>
          )
        }
      >
        <p className="whitespace-pre-line text-sm text-slate-600">{request?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  )
}

/**
 * confirm(message, { title?, danger?, confirmLabel?, cancelLabel?, okOnly?, okLabel? }) => Promise<boolean>
 * - Par défaut : boîte Annuler/Confirmer, résout `true` si confirmé.
 * - `okOnly: true` : boîte à bouton unique (équivalent de window.alert), résout toujours `true`.
 * - `danger: true` : le bouton de confirmation est mis en évidence en rouge (action destructive).
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm doit être utilisé dans un <ConfirmProvider>')
  return confirm
}
