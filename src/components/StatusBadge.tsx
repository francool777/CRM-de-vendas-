import { cn } from '@/lib/utils'
import { STATUS_LABELS, type Status } from '@/lib/types'

const STATUS_STYLES: Record<Status, string> = {
  LEAD: 'bg-dust/50 text-charcoal',
  INTERESSADO: 'bg-amber/25 text-charcoal',
  EM_NEGOCIACAO: 'bg-amber/60 text-ink',
  REUNIAO_AGENDADA: 'bg-paprika/15 text-paprika',
  NAO_RESPONDEU: 'bg-charcoal/10 text-charcoal',
  FECHADO: 'bg-paprika text-cream',
  DESCARTADO: 'bg-charcoal/70 text-cream',
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4',
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
