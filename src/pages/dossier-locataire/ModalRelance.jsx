import React from 'react'
import { Modal, Button } from '../../components/ui.jsx'

export default function ModalRelance({ rappel, onClose }) {
  return (
    <Modal open={!!rappel} onClose={onClose} title="Relance enregistrée" footer={<Button onClick={onClose}>Fermer</Button>}>
      {rappel && (
        <>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{rappel}</pre>
          <p className="mt-2 text-xs text-slate-400">Cette relance a été enregistrée dans la messagerie du locataire.</p>
        </>
      )}
    </Modal>
  )
}
