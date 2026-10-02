import React, { useMemo, useState } from 'react'
import { LayoutDashboard, CheckSquare, Banknote, Users, MoreHorizontal, X } from 'lucide-react'
import { NavProvider } from './lib/nav.jsx'
import { useStore } from './lib/store.jsx'
import { getTaches } from './lib/taches.js'
import { statutReversement } from './lib/utils.js'
import Dashboard from './pages/Dashboard.jsx'
import Taches from './pages/Taches.jsx'
import Immeubles from './pages/Immeubles.jsx'
import Locataires from './pages/Locataires.jsx'
import Baux from './pages/Baux.jsx'
import Paiements from './pages/Paiements.jsx'
import Reversements from './pages/Reversements.jsx'
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
      { id: 'reversements', label: 'Reversements', icon: '💸', Component: Reversements },
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

// Les 4 destinations les plus utilisées au quotidien occupent la barre
// flottante du bas ; tout le reste (y compris sur ordinateur, où la colonne
// de gauche affiche déjà tout) passe par l'onglet "Plus".
const ONGLETS_MOBILES = [
  { id: 'dashboard', label: 'Accueil', Icon: LayoutDashboard },
  { id: 'paiements', label: 'Paiements', Icon: Banknote },
  { id: 'locataires', label: 'Locataires', Icon: Users },
  { id: 'taches', label: 'Tâches', Icon: CheckSquare },
]

export default function App() {
  const { state } = useStore()
  const [active, setActive] = useState('dashboard')
  const [plusOuvert, setPlusOuvert] = useState(false)
  const current = NAV.find((n) => n.id === active) ?? NAV[0]
  const Page = current.Component
  const nbTachesUrgentes = useMemo(() => getTaches(state).filter((t) => t.urgence === 'haute').length, [state])
  const nbReversementsEnAttente = useMemo(() => state.paiements.filter((p) => statutReversement(p) === 'a_reverser').length, [state.paiements])

  function aller(id) {
    setActive(id)
    setPlusOuvert(false)
  }

  const badgePour = (id) =>
    id === 'taches' && nbTachesUrgentes > 0 ? nbTachesUrgentes
      : id === 'reversements' && nbReversementsEnAttente > 0 ? nbReversementsEnAttente
      : null

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Colonne de navigation — ordinateur (≥1024px) */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand text-sm font-extrabold text-white shadow-glow-brand">E</span>
          <div className="leading-tight">
            <p className="text-base font-extrabold tracking-tight text-slate-900">Emirio</p>
            <p className="text-[11px] text-slate-500">Gestion locative</p>
          </div>
        </div>
        <nav className="space-y-4 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => aller(item.id)}
                    aria-current={item.id === active ? 'page' : undefined}
                    className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                      item.id === active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badgePour(item.id) && (
                      <span className="rounded-full bg-danger-500 px-1.5 py-0.5 text-xs font-bold text-white">{badgePour(item.id)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm lg:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand text-xs font-extrabold text-white">E</span>
          <span className="text-[17px] font-extrabold tracking-tight text-slate-900">{current.label}</span>
        </header>

        <main className="flex-1 p-4 pb-28 sm:p-6 lg:p-8 lg:pb-8">
          <NavProvider onNavigate={setActive}>
            <Page />
          </NavProvider>
        </main>
      </div>

      {/* Barre d'onglets flottante — téléphone et tablette (<1024px) */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-between rounded-[28px] border border-slate-200 bg-white/90 px-2 py-1.5 shadow-soft-lg backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
        aria-label="Navigation principale"
      >
        {ONGLETS_MOBILES.map(({ id, label, Icon }) => {
          const estActif = id === active
          const badge = badgePour(id)
          return (
            <button
              key={id}
              onClick={() => aller(id)}
              aria-current={estActif ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] py-1.5 transition-colors ${
                estActif ? 'bg-brand-50 text-brand-700' : 'text-slate-500'
              }`}
            >
              <Icon size={22} strokeWidth={2.2} aria-hidden />
              <span className="text-[10.5px] font-bold">{label}</span>
              {badge && (
                <span className="absolute right-3 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
        <button
          onClick={() => setPlusOuvert(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] py-1.5 text-slate-500"
        >
          <MoreHorizontal size={22} strokeWidth={2.2} aria-hidden />
          <span className="text-[10.5px] font-bold">Plus</span>
        </button>
      </nav>

      {/* Feuille "Plus" — le reste des modules, sur téléphone */}
      {plusOuvert && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/30 lg:hidden" onClick={() => setPlusOuvert(false)}>
          <div
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-soft-lg animate-fadeUp"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[18px] font-extrabold tracking-tight text-slate-900">Tous les modules</p>
              <button onClick={() => setPlusOuvert(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="space-y-5">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{section.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => aller(item.id)}
                        className={`relative flex items-center gap-2.5 rounded-2xl px-3 py-3 text-left text-sm font-semibold ${
                          item.id === active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span aria-hidden>{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {badgePour(item.id) && (
                          <span className="rounded-full bg-danger-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{badgePour(item.id)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
