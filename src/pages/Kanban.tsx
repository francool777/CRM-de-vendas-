import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { addDays, format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LeadCard } from '@/components/LeadCard'
import { LeadDetailDialog } from '@/components/LeadDetailDialog'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import { KANBAN_ORDER, STATUS_LABELS, type Lead, type Status } from '@/lib/types'

const COLUNA_COR: Record<Status, string> = {
  LEAD: 'bg-dust',
  INTERESSADO: 'bg-amber/70',
  EM_NEGOCIACAO: 'bg-amber',
  REUNIAO_AGENDADA: 'bg-paprika/70',
  FECHADO: 'bg-paprika',
  DESCARTADO: 'bg-charcoal/60',
  NAO_RESPONDEU: 'bg-charcoal/30',
}

function DraggableCard({
  lead,
  onOpen,
  onTemperaturaChange,
}: {
  lead: Lead
  onOpen: () => void
  onTemperaturaChange: (t: Lead['temperatura']) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn('touch-none', isDragging && 'z-30 opacity-40')}
    >
      <LeadCard lead={lead} onClick={onOpen} onTemperaturaChange={onTemperaturaChange} />
    </div>
  )
}

function Coluna({
  status,
  leads,
  onOpenLead,
  onTemperaturaChange,
}: {
  status: Status
  leads: Lead[]
  onOpenLead: (lead: Lead) => void
  onTemperaturaChange: (lead: Lead, t: Lead['temperatura']) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border border-dust/60 bg-dust/15 transition-colors',
        isOver && 'border-paprika/60 bg-paprika/5',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn('h-2.5 w-2.5 rounded-full', COLUNA_COR[status])} />
        <h2 className="font-heading text-sm uppercase tracking-wider text-ink">
          {STATUS_LABELS[status]}
        </h2>
        <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-charcoal">
          {leads.length}
        </span>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0 scrollbar-thin">
        {leads.map((lead) => (
          <DraggableCard
            key={lead.id}
            lead={lead}
            onOpen={() => onOpenLead(lead)}
            onTemperaturaChange={(t) => onTemperaturaChange(lead, t)}
          />
        ))}
      </div>
    </div>
  )
}

export function Kanban() {
  const { leads, updateLead } = useData()
  const { showToast } = useToast()

  const [ativoId, setAtivoId] = useState<number | null>(null)
  const [detalheId, setDetalheId] = useState<number | null>(null)
  const [reuniaoLeadId, setReuniaoLeadId] = useState<number | null>(null)
  const [reuniaoValor, setReuniaoValor] = useState('')
  const [ajusteFollowup, setAjusteFollowup] = useState<{
    leadId: number
    f1: string
    f2: string
  } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const porStatus = useMemo(() => {
    const mapa = new Map<Status, Lead[]>()
    for (const s of KANBAN_ORDER) mapa.set(s, [])
    for (const lead of leads) mapa.get(lead.status)?.push(lead)
    return mapa
  }, [leads])

  const leadAtivo = ativoId !== null ? leads.find((l) => l.id === ativoId) : undefined
  const leadDetalhe = detalheId !== null ? (leads.find((l) => l.id === detalheId) ?? null) : null

  function onDragStart(e: DragStartEvent) {
    setAtivoId(Number(e.active.id))
  }

  async function onDragEnd(e: DragEndEvent) {
    setAtivoId(null)
    const { active, over } = e
    if (!over) return
    const novoStatus = over.id as Status
    const lead = leads.find((l) => l.id === Number(active.id))
    if (!lead || lead.status === novoStatus) return

    const patch: Partial<Lead> = { status: novoStatus }

    // 1ª saída da coluna LEAD = 1º contato confirmado → sugere follow-ups.
    // A data de 1º contato já vem preenchida desde a criação do lead (padrão =
    // data de cadastro), então o sinal de "ainda não sugerimos follow-up" é a
    // ausência das próprias datas de follow-up, não mais a de 1º contato.
    const confirmouPrimeiroContato =
      lead.status === 'LEAD' && novoStatus !== 'LEAD' && !lead.followup1Data && !lead.followup2Data
    let f1: Date | null = null
    let f2: Date | null = null
    if (confirmouPrimeiroContato) {
      const hoje = new Date()
      f1 = addDays(hoje, 4)
      f2 = addDays(f1, 6)
      patch.followup1Data = f1.toISOString()
      patch.followup2Data = f2.toISOString()
    }

    await updateLead(lead.id, patch)

    if (confirmouPrimeiroContato && f1 && f2) {
      const leadId = lead.id
      showToast({
        title: '1º contato confirmado ✓',
        description: `Follow-ups sugeridos: ${format(f1, 'dd/MM')} e ${format(f2, 'dd/MM')}`,
        actionLabel: 'Ajustar',
        duration: 9000,
        onAction: () =>
          setAjusteFollowup({
            leadId,
            f1: format(f1!, 'yyyy-MM-dd'),
            f2: format(f2!, 'yyyy-MM-dd'),
          }),
      })
    }

    // soltou em "Reunião agendada" → abre seletor de data/hora
    if (novoStatus === 'REUNIAO_AGENDADA') {
      const amanha10h = new Date()
      amanha10h.setDate(amanha10h.getDate() + 1)
      amanha10h.setHours(10, 0, 0, 0)
      setReuniaoValor(
        lead.dataReuniao
          ? format(new Date(lead.dataReuniao), "yyyy-MM-dd'T'HH:mm")
          : format(amanha10h, "yyyy-MM-dd'T'HH:mm"),
      )
      setReuniaoLeadId(lead.id)
    }
  }

  async function salvarReuniao() {
    if (reuniaoLeadId === null) return
    if (reuniaoValor) {
      await updateLead(reuniaoLeadId, { dataReuniao: new Date(reuniaoValor).toISOString() })
      showToast({ title: 'Reunião agendada!', description: format(new Date(reuniaoValor), "dd/MM 'às' HH:mm") })
    }
    setReuniaoLeadId(null)
  }

  async function salvarAjusteFollowup() {
    if (!ajusteFollowup) return
    await updateLead(ajusteFollowup.leadId, {
      followup1Data: ajusteFollowup.f1 ? new Date(`${ajusteFollowup.f1}T12:00:00`).toISOString() : null,
      followup2Data: ajusteFollowup.f2 ? new Date(`${ajusteFollowup.f2}T12:00:00`).toISOString() : null,
    })
    setAjusteFollowup(null)
    showToast({ title: 'Follow-ups atualizados' })
  }

  return (
    <div>
      <h1 className="mb-4 font-heading text-2xl uppercase tracking-wide text-ink">Kanban</h1>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex items-start gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {KANBAN_ORDER.map((status) => (
            <Coluna
              key={status}
              status={status}
              leads={porStatus.get(status) ?? []}
              onOpenLead={(lead) => setDetalheId(lead.id)}
              onTemperaturaChange={(lead, t) => updateLead(lead.id, { temperatura: t })}
            />
          ))}
        </div>
        <DragOverlay>
          {leadAtivo ? <LeadCard lead={leadAtivo} className="rotate-2 shadow-xl" /> : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailDialog lead={leadDetalhe} onClose={() => setDetalheId(null)} />

      {/* Seletor de data/hora da reunião */}
      <Dialog open={reuniaoLeadId !== null} onOpenChange={(open) => !open && setReuniaoLeadId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reunião agendada</DialogTitle>
            <DialogDescription>Quando será a reunião com este lead?</DialogDescription>
          </DialogHeader>
          <Input
            type="datetime-local"
            value={reuniaoValor}
            onChange={(e) => setReuniaoValor(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReuniaoLeadId(null)}>
              Depois
            </Button>
            <Button onClick={salvarReuniao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ajuste das datas de follow-up sugeridas */}
      <Dialog open={!!ajusteFollowup} onOpenChange={(open) => !open && setAjusteFollowup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar follow-ups</DialogTitle>
            <DialogDescription>
              Datas sugeridas: +4 dias (follow-up 1) e +6 dias depois (follow-up 2).
            </DialogDescription>
          </DialogHeader>
          {ajusteFollowup && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal">Follow-up 1</label>
                <Input
                  type="date"
                  value={ajusteFollowup.f1}
                  onChange={(e) => setAjusteFollowup({ ...ajusteFollowup, f1: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal">Follow-up 2</label>
                <Input
                  type="date"
                  value={ajusteFollowup.f2}
                  onChange={(e) => setAjusteFollowup({ ...ajusteFollowup, f2: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAjusteFollowup(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarAjusteFollowup}>Salvar datas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
