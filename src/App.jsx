import React, { useMemo, useState } from 'react'
import { NavProvider } from './lib/nav.jsx'
import { useStore } from './lib/store.jsx'
import { getTaches } from './lib/taches.js'
import Dashboard from './pages/Dashboard.jsx'
import Taches from './pages/Taches.jsx'
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

const NAV_SECTIONS = [
  {
    label: 'Vue d\'ensemble',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: '🏠', Component: Dashboard },
      { id: 'taches', label: 'Tâches', icon: '✅', Component: Taches },
    ],
  },
  {
    label: 'Patrimoine',
    items: [
      { id: 'immeubles', label: 'Immeubles', icon: '🏢', Component: Immeubles },
      { id: 'locataires', label: 'Locataires', icon: '👤', Component: Locataires },
      { id: 'baux', label: 'Baux', icon: '📄', Component: Baux },
      { id: 'paiements', label: 'Paiements', icon: '💶', Component: Paiements },
    ],
  },
  {
    label: 'Suivi terrain',
    items: [
      { id: 'travaux', label: 'Travaux', icon: '🛠️', Component: Travaux },
      { id: 'sinistres', label: 'Sinistres', icon: '🛡️', Component: Sinistres },
      { id: 'prestataires', label: 'Prestataires', icon: '📇', Component: Prestataires },
      { id: 'candidatures', label: 'Candidatures', icon: '📥', Component: Candidatures },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'messagerie', label: 'Messagerie', icon: '💬', Component: Messagerie },
      { id: 'agenda', label: 'Agenda', icon: '📅', Component: Agenda },
      { id: 'documents', label: 'Documents', icon: '🧾', Component: Documents },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { id: 'comptabilite', label: 'Comptabilité', icon: '📊', Component: Comptabilite },
      { id: 'parametres', label: 'Paramètres', icon: '⚙️', Component: Parametres },
    ],
  },
]

const NAV = NAV_SECTIONS.flatMap((s) => s.items)

export default function App() {
  const { state } = useStore()
  const [active, setActive] = useState('dashboard')
  const [navOpen, setNavOpen] = useState(false)
  const current = NAV.find((n) => n.id === active) ?? NAV[0]
  const Page = current.Component
  const nbTachesUrgentes = useMemo(() => getTaches(state).filter((t) => t.urgence === 'haute').length, [state])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-extrabold text-white">E</span>
          <div className="leading-tight">
            <p className="text-base font-extrabold tracking-tight text-slate-900">Emirio</p>
            <p className="text-[11px] text-slate-400">Gestion locative</p>
          </div>
        </div>
        <nav className="space-y-4 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
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
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.id === 'taches' && nbTachesUrgentes > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">{nbTachesUrgentes}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
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
