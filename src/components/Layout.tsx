import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Redo2, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NewLeadModal } from '@/components/NewLeadModal'
import { useData } from '@/store/DataContext'
import { useUndoRedoShortcuts } from '@/hooks/useUndoRedoShortcuts'

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/kanban', label: 'Kanban' },
  { to: '/leads', label: 'Leads' },
  { to: '/semana', label: 'Semana' },
  { to: '/playbook', label: 'Playbook' },
]

export function Layout() {
  const [novoLeadAberto, setNovoLeadAberto] = useState(false)
  const { erro, undo, redo, canUndo, canRedo, undoLabel, redoLabel } = useData()
  useUndoRedoShortcuts()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-dust/70 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-2">
            <h1 className="font-heading text-xl uppercase leading-none tracking-wide text-ink">
              Arthur Franco Design
            </h1>
            <span className="font-script text-lg leading-none text-paprika">CRM</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ink text-cream'
                      : 'text-charcoal hover:bg-dust/40 hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="ml-2 flex items-center gap-0.5 border-l border-dust/70 pl-2">
              <button
                onClick={() => undo()}
                disabled={!canUndo}
                title={undoLabel ? `Desfazer: ${undoLabel} (Ctrl+Z)` : 'Nada para desfazer'}
                className="rounded-lg p-1.5 text-charcoal transition-colors hover:bg-dust/40 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => redo()}
                disabled={!canRedo}
                title={redoLabel ? `Refazer: ${redoLabel} (Ctrl+Shift+Z)` : 'Nada para refazer'}
                className="rounded-lg p-1.5 text-charcoal transition-colors hover:bg-dust/40 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {erro && (
        <div className="border-b border-paprika/30 bg-paprika/10 px-6 py-2 text-sm text-paprika">
          Não foi possível falar com a API local ({erro}). Verifique se <code>npm run dev</code>{' '}
          está rodando (a API sobe junto na porta 3001).
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      {/* Botão flutuante de cadastro rápido */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setNovoLeadAberto(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-paprika px-5 py-3 font-medium text-cream shadow-lg shadow-paprika/30"
      >
        <Plus className="h-5 w-5" />
        Novo Lead
      </motion.button>

      <NewLeadModal open={novoLeadAberto} onOpenChange={setNovoLeadAberto} />
    </div>
  )
}
