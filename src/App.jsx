import React, { useState } from 'react'
import { NavProvider } from './lib/nav.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Immeubles from './pages/Immeubles.jsx'
import Locataires from './pages/Locataires.jsx'
import Baux from './pages/Baux.jsx'
import Paiements from './pages/Paiements.jsx'
import Travaux from './pages/Travaux.jsx'
import Prestataires from './pages/Prestataires.jsx'
import Candidatures from './pages/Candidatures.jsx'
import Agenda from './pages/Agenda.jsx'
import Documents from './pages/Documents.jsx'
import Comptabilite from './pages/Comptabilite.jsx'
import Sinistres from './pages/Sinistres.jsx'
import Messagerie from './pages/Messagerie.jsx'
import Parametres from './pages/Parametres.jsx'

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '🏠', Component: Dashboard },
  { id: 'immeubles', label: 'Immeubles', icon: '🏢', Component: Immeubles },
  { id: 'locataires', label: 'Locataires', icon: '👤', Component: Locataires },
  { id: 'baux', label: 'Baux', icon: '📄', Component: Baux },
  { id: 'paiements', label: 'Paiements', icon: '💶', Component: Paiements },
  { id: 'travaux', label: 'Travaux', icon: '🛠️', Component: Travaux },
  { id: 'prestataires', label: 'Prestataires', icon: '📇', Component: Prestataires },
  { id: 'candidatures', label: 'Candidatures', icon: '📥', Component: Candidatures },
  { id: 'sinistres', label: 'Sinistres', icon: '🛡️', Component: Sinistres },
  { id: 'messagerie', label: 'Messagerie', icon: '💬', Component: Messagerie },
  { id: 'agenda', label: 'Agenda', icon: '📅', Component: Agenda },
  { id: 'documents', label: 'Documents', icon: '🧾', Component: Documents },
  { id: 'comptabilite', label: 'Comptabilité', icon: '📊', Component: Comptabilite },
  { id: 'parametres', label: 'Paramètres', icon: '⚙️', Component: Parametres },
]

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [navOpen, setNavOpen] = useState(false)
  const current = NAV.find((n) => n.id === active) ?? NAV[0]
  const Page = current.Component

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <span className="text-xl font-extrabold tracking-tight text-brand-600">Emirio</span>
          <span className="text-xs text-slate-400">Gestion locative</span>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActive(item.id)
                setNavOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                item.id === active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setNavOpen(false)} />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <span className="font-semibold text-slate-900">{current.label}</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <NavProvider onNavigate={setActive}>
            <Page />
          </NavProvider>
        </main>
      </div>
    </div>
  )
}
