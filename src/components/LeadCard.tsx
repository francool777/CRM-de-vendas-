import { format } from 'date-fns'
import { AlertTriangle, BookOpen, CalendarClock, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { TemperatureSelector } from '@/components/TemperatureSelector'
import { cn } from '@/lib/utils'
import { daysSinceLastContact, formatBRL, isFollowupOverdue } from '@/lib/leadUtils'
import type { Lead, Temperatura } from '@/lib/types'

interface Props {
  lead: Lead
  onClick?: () => void
  onTemperaturaChange?: (t: Temperatura) => void
  className?: string
}

export function LeadCard({ lead, onClick, onTemperaturaChange, className }: Props) {
  const navigate = useNavigate()
  const atrasado = isFollowupOverdue(lead)
  const dias = daysSinceLastContact(lead)

  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-xl border bg-white/80 p-3 shadow-card transition-shadow hover:shadow-md',
        atrasado ? 'border-2 border-paprika' : 'border-dust/70',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-ink">{lead.nomePerfil}</p>
        <div className="flex shrink-0 items-center gap-1">
          {atrasado && <AlertTriangle className="h-4 w-4 text-paprika" />}
          {lead.linkPerfil && (
            <a
              href={lead.linkPerfil}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-charcoal/60 transition-colors hover:text-paprika"
              title="Abrir perfil"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/playbook?lead=${lead.id}`)
            }}
            className="text-charcoal/60 transition-colors hover:text-paprika"
            title="Abrir Playbook com este lead"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.segmentoNicho && <Badge variant="secondary">{lead.segmentoNicho}</Badge>}
        {lead.plataformaContato && lead.plataformaContato !== 'IG' && (
          <Badge variant="outline">{lead.plataformaContato}</Badge>
        )}
        {lead.propostaEnviada && (
          <Badge variant="amber">
            proposta{lead.valorProposta ? ` · ${formatBRL(lead.valorProposta)}` : ''}
          </Badge>
        )}
      </div>

      {lead.status === 'REUNIAO_AGENDADA' && lead.dataReuniao && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-paprika">
          <CalendarClock className="h-3.5 w-3.5" />
          {format(new Date(lead.dataReuniao), "dd/MM 'às' HH:mm")}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className={cn('text-[11px]', atrasado ? 'font-medium text-paprika' : 'text-charcoal/70')}>
          {dias === 0 ? 'contato hoje' : `${dias} ${dias === 1 ? 'dia' : 'dias'} sem contato`}
        </span>
        <TemperatureSelector
          size="sm"
          value={lead.temperatura}
          onChange={(t) => onTemperaturaChange?.(t)}
        />
      </div>
    </div>
  )
}
