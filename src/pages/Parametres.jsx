import React, { useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { Card, PageHeader, Button, EmptyState } from '../components/ui.jsx'

export default function Parametres() {
  const { state, resetDemo, importState } = useStore()
  const fileInput = useRef(null)
  const [message, setMessage] = useState(null)

  function exporterSauvegarde() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emirio-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', texte: 'Sauvegarde exportée.' })
  }

  function importerSauvegarde(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!confirm('Importer cette sauvegarde va remplacer toutes les données actuelles. Continuer ?')) return
        importState(data)
        setMessage({ tone: 'ok', texte: 'Sauvegarde importée avec succès.' })
      } catch {
        setMessage({ tone: 'error', texte: 'Fichier invalide : impossible de lire cette sauvegarde.' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function reinitialiser() {
    if (confirm('Réinitialiser toutes les données avec le jeu de démonstration ? Cette action est irréversible.')) {
      resetDemo()
      setMessage({ tone: 'ok', texte: 'Données réinitialisées.' })
    }
  }

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Sauvegarde et données de l'application" />

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${message.tone === 'ok' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
          {message.texte}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-base font-semibold text-slate-900">Auto-sauvegarde locale</h2>
          <p className="mb-4 text-sm text-slate-500">
            Toutes vos données sont enregistrées automatiquement dans le stockage local de ce navigateur.
            Exportez régulièrement une sauvegarde pour ne rien perdre en cas de changement d'appareil.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exporterSauvegarde}>Exporter ma sauvegarde</Button>
            <Button variant="secondary" onClick={() => fileInput.current?.click()}>Importer une sauvegarde</Button>
            <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={importerSauvegarde} />
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-base font-semibold text-slate-900">Données de démonstration</h2>
          <p className="mb-4 text-sm text-slate-500">
            Repartir d'un jeu de données d'exemple (immeubles, locataires, baux, paiements de démonstration).
          </p>
          <Button variant="danger" onClick={reinitialiser}>Réinitialiser avec les données de démo</Button>
        </Card>
      </div>

      <div className="mt-6">
        <EmptyState
          title="Pas de compte, pas de serveur"
          subtitle="Emirio fonctionne entièrement dans votre navigateur : aucune donnée n'est envoyée à un serveur externe."
        />
      </div>
    </div>
  )
}
