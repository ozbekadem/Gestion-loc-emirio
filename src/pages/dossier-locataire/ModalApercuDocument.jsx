import React from 'react'
import { Modal, Button } from '../../components/ui.jsx'

export default function ModalApercuDocument({ document, onClose }) {
  return (
    <Modal open={!!document} onClose={onClose} title={document?.nom} footer={<Button onClick={onClose}>Fermer</Button>}>
      {document?.mime?.startsWith('image/') ? (
        <img src={document.dataUrl} alt={document.nom} className="w-full rounded-lg" />
      ) : (
        <a href={document?.dataUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">Ouvrir le document</a>
      )}
    </Modal>
  )
}
