import { useMemo, useState } from 'react'
import { addDays, addWeeks, format, isSameDay, isToday, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { LeadDetailDialog } from '@/components/LeadDetailDialog'
import { useData } from '@/store/DataContext'
import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'

// data de contato do lead: 1º contato quando existir, senão data de criação
function dataContato(lead: Lead): Date {
  return new Date(lead.dataPrimeiroContato ?? lead.criadoEm)
}

export function Weekly() {
  const { leads } = useData()
  const [inicioSemana, setInicioSemana] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )
  const [diaExpandido, setDiaExpandido] = useState<number | null>(null)
  const [detalheId, setDetalheId] = useState<number | null>(null)

  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i)),
    [inicioSemana],
  )

  const leadsPorDia = useMemo(
    () => dias.map((dia) => leads.filter((l) => isSameDay(dataContato(l), dia))),
    [dias, leads],
  )

  const totalSemana = leadsPorDia.reduce((acc, ls) => acc + ls.length, 0)
  const leadDetalhe = detalheId !== null ? (leads.find((l) => l.id === detalheId) ?? null) : null

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl uppercase tracking-wide text-ink">Visão semanal</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setInicioSemana((s) => addWeeks(s, -1))
              setDiaExpandido(null)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[220px] text-center">
            <p className="text-sm font-semibold text-ink">
              {format(inicioSemana, 'dd/MM')} – {format(addDays(inicioSemana, 6), 'dd/MM/yyyy')}
            </p>
            <p className="text-xs text-charcoal/70">
              <span className="font-semibold text-paprika">{totalSemana}</span>{' '}
              {totalSemana === 1 ? 'lead contatado' : 'leads contatados'} na semana
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setInicioSemana((s) => addWeeks(s, 1))
              setDiaExpandido(null)
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {dias.map((dia, i) => {
          const leadsDoDia = leadsPorDia[i]
          const segmentos = new Map<string, number>()
          for (const l of leadsDoDia) {
            if (l.segmentoNicho) {
              segmentos.set(l.segmentoNicho, (segmentos.get(l.segmentoNicho) ?? 0) + 1)
            }
          }
          const expandido = diaExpandido === i

          return (
            <div
              key={dia.toISOString()}
              className={cn(
                'rounded-xl border bg-white/70 shadow-card transition-colors',
                isToday(dia) ? 'border-paprika/50' : 'border-dust/70',
              )}
            >
              <button
                onClick={() => setDiaExpandido(expandido ? null : i)}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left"
              >
                <div className="w-28">
                  <p className={cn('text-sm font-semibold capitalize', isToday(dia) && 'text-paprika')}>
                    {format(dia, 'EEEE', { locale: ptBR })}
                  </p>
                  <p className="text-xs text-charcoal/60">{format(dia, 'dd/MM')}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                    leadsDoDia.length > 0 ? 'bg-paprika text-cream' : 'bg-dust/40 text-charcoal/60',
                  )}
                >
                  {leadsDoDia.length}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[...segmentos.entries()].map(([seg, qtd]) => (
                    <Badge key={seg} variant="secondary">
                      {seg}
                      {qtd > 1 ? ` ×${qtd}` : ''}
                    </Badge>
                  ))}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {expandido && leadsDoDia.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="border-t border-dust/50 px-4 py-2">
                      {leadsDoDia.map((l) => (
                        <li key={l.id}>
                          <button
                            onClick={() => setDetalheId(l.id)}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-dust/20"
                          >
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                              {l.nomePerfil}
                            </span>
                            {l.segmentoNicho && <Badge variant="outline">{l.segmentoNicho}</Badge>}
                            <StatusBadge status={l.status} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <LeadDetailDialog lead={leadDetalhe} onClose={() => setDetalheId(null)} />
    </div>
  )
}
