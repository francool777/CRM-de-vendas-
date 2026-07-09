import { useEffect, useMemo, useState } from 'react'
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
import { addDays, format, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
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
import { Select } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LeadCard } from '@/components/LeadCard'
import { LeadDetailDialog } from '@/components/LeadDetailDialog'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import { isFollowupOverdue } from '@/lib/leadUtils'
import {
  KANBAN_ORDER,
  STATUS_LABELS,
  TEMPERATURA_LABELS,
  TEMPERATURAS,
  type Lead,
  type Status,
} from '@/lib/types'

const COLUNA_COR: Record<Status, string> = {
  LEAD: 'bg-dust',
  INTERESSADO: 'bg-amber/70',
  EM_NEGOCIACAO: 'bg-amber',
  REUNIAO_AGENDADA: 'bg-paprika/70',
  FECHADO: 'bg-paprika',
  DESCARTADO: 'bg-charcoal/60',
  NAO_RESPONDEU: 'bg-charcoal/30',
}

// Quantos cards renderizar por coluna de início — evita montar centenas de nós
// de uma vez (cada um com hooks do dnd-kit). "Carregar mais" some se acabou.
const TAMANHO_PAGINA = 20

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
  totalSemFiltro,
  visiveis,
  onCarregarMais,
  onOpenLead,
  onTemperaturaChange,
}: {
  status: Status
  leads: Lead[]
  totalSemFiltro: number
  visiveis: number
  onCarregarMais: () => void
  onOpenLead: (lead: Lead) => void
  onTemperaturaChange: (lead: Lead, t: Lead['temperatura']) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const restantes = leads.length - visiveis

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full w-72 shrink-0 flex-col rounded-xl border border-dust/60 bg-dust/15 transition-colors',
        isOver && 'border-paprika/60 bg-paprika/5',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn('h-2.5 w-2.5 rounded-full', COLUNA_COR[status])} />
        <h2 className="font-heading text-sm uppercase tracking-wider text-ink">
          {STATUS_LABELS[status]}
        </h2>
        <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-charcoal">
          {leads.length !== totalSemFiltro ? `${leads.length}/${totalSemFiltro}` : leads.length}
        </span>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0 scrollbar-thin">
        {leads.slice(0, visiveis).map((lead) => (
          <DraggableCard
            key={lead.id}
            lead={lead}
            onOpen={() => onOpenLead(lead)}
            onTemperaturaChange={(t) => onTemperaturaChange(lead, t)}
          />
        ))}
        {restantes > 0 && (
          <button
            onClick={onCarregarMais}
            className="shrink-0 rounded-lg border border-dashed border-charcoal/30 py-2 text-xs font-medium text-charcoal/70 transition-colors hover:border-paprika hover:text-paprika"
          >
            Carregar mais ({restantes} restante{restantes === 1 ? '' : 's'})
          </button>
        )}
      </div>
    </div>
  )
}

export function Kanban() {
  const { leads, segmentos, plataformas, updateLead } = useData()
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

  // busca + filtros
  const [busca, setBusca] = useState('')
  const [modoSemana, setModoSemana] = useState(false)
  const [inicioSemana, setInicioSemana] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [fSegmento, setFSegmento] = useState('')
  const [fTemperatura, setFTemperatura] = useState('')
  const [fPlataforma, setFPlataforma] = useState('')
  const [fDe, setFDe] = useState('')
  const [fAte, setFAte] = useState('')
  const [somenteVencidos, setSomenteVencidos] = useState(false)

  // paginação por coluna (reseta quando os filtros mudam)
  const [visiveisPorColuna, setVisiveisPorColuna] = useState<Record<Status, number>>(
    () => Object.fromEntries(KANBAN_ORDER.map((s) => [s, TAMANHO_PAGINA])) as Record<Status, number>,
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const filtrosAtivos = [
    busca.trim() !== '',
    modoSemana,
    fSegmento !== '',
    fTemperatura !== '',
    fPlataforma !== '',
    fDe !== '',
    fAte !== '',
    somenteVencidos,
  ].filter(Boolean).length

  const leadsFiltrados = useMemo(() => {
    return leads.filter((l) => {
      if (busca.trim()) {
        const q = busca.trim().toLowerCase()
        const alvo = `${l.nomePerfil} ${l.linkPerfil} ${l.whatsapp ?? ''} ${l.segmentoNicho ?? ''} ${l.observacoes ?? ''}`.toLowerCase()
        if (!alvo.includes(q)) return false
      }
      if (modoSemana) {
        const criado = new Date(l.criadoEm)
        if (criado < inicioSemana || criado >= addDays(inicioSemana, 7)) return false
      }
      if (fSegmento && l.segmentoNicho !== fSegmento) return false
      if (fTemperatura && l.temperatura !== fTemperatura) return false
      if (fPlataforma && l.plataformaContato !== fPlataforma) return false
      if (fDe && new Date(l.criadoEm) < new Date(`${fDe}T00:00:00`)) return false
      if (fAte && new Date(l.criadoEm) > new Date(`${fAte}T23:59:59`)) return false
      if (somenteVencidos && !isFollowupOverdue(l)) return false
      return true
    })
  }, [leads, busca, modoSemana, inicioSemana, fSegmento, fTemperatura, fPlataforma, fDe, fAte, somenteVencidos])

  // qualquer mudança de filtro reseta a paginação (senão "restantes" fica errado)
  useEffect(() => {
    setVisiveisPorColuna(
      Object.fromEntries(KANBAN_ORDER.map((s) => [s, TAMANHO_PAGINA])) as Record<Status, number>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, modoSemana, inicioSemana, fSegmento, fTemperatura, fPlataforma, fDe, fAte, somenteVencidos])

  const porStatus = useMemo(() => {
    const mapa = new Map<Status, Lead[]>()
    for (const s of KANBAN_ORDER) mapa.set(s, [])
    for (const lead of leadsFiltrados) mapa.get(lead.status)?.push(lead)
    return mapa
  }, [leadsFiltrados])

  const totalPorStatusSemFiltro = useMemo(() => {
    const mapa = new Map<Status, number>()
    for (const s of KANBAN_ORDER) mapa.set(s, 0)
    for (const lead of leads) mapa.set(lead.status, (mapa.get(lead.status) ?? 0) + 1)
    return mapa
  }, [leads])

  const leadAtivo = ativoId !== null ? leads.find((l) => l.id === ativoId) : undefined
  const leadDetalhe = detalheId !== null ? (leads.find((l) => l.id === detalheId) ?? null) : null

  function limparFiltros() {
    setBusca('')
    setModoSemana(false)
    setFSegmento('')
    setFTemperatura('')
    setFPlataforma('')
    setFDe('')
    setFAte('')
    setSomenteVencidos(false)
  }

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
    <div className="flex h-[calc(100vh-8.5rem)] min-h-0 flex-col">
      {/* cabeçalho: título + busca + filtros + navegação de semana */}
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
        <h1 className="mr-2 font-heading text-2xl uppercase tracking-wide text-ink">Kanban</h1>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/50" />
          <Input
            placeholder="Buscar por nome, WhatsApp, link, observações…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-64 pl-8"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
              {filtrosAtivos > 0 && (
                <span className="ml-1 rounded-full bg-paprika px-1.5 text-[10px] font-bold text-cream">
                  {filtrosAtivos}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between gap-2 rounded-lg px-1 py-1 text-sm">
                <span className="text-charcoal">Só follow-up vencido</span>
                <input
                  type="checkbox"
                  checked={somenteVencidos}
                  onChange={(e) => setSomenteVencidos(e.target.checked)}
                  className="h-4 w-4 accent-paprika"
                />
              </label>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal">Segmento</label>
                <Select value={fSegmento} onChange={(e) => setFSegmento(e.target.value)}>
                  <option value="">Todos</option>
                  {segmentos.map((s) => (
                    <option key={s.id} value={s.nome}>
                      {s.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal">Temperatura</label>
                <Select value={fTemperatura} onChange={(e) => setFTemperatura(e.target.value)}>
                  <option value="">Todas</option>
                  {TEMPERATURAS.map((t) => (
                    <option key={t} value={t}>
                      {TEMPERATURA_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal">Plataforma</label>
                <Select value={fPlataforma} onChange={(e) => setFPlataforma(e.target.value)}>
                  <option value="">Todas</option>
                  {plataformas.map((p) => (
                    <option key={p.id} value={p.nome}>
                      {p.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal">Cadastrado entre</label>
                <div className="flex items-center gap-1">
                  <Input type="date" value={fDe} onChange={(e) => setFDe(e.target.value)} className="text-xs" />
                  <span className="text-xs text-charcoal/60">e</span>
                  <Input type="date" value={fAte} onChange={(e) => setFAte(e.target.value)} className="text-xs" />
                </div>
              </div>
              {filtrosAtivos > 0 && (
                <button
                  onClick={limparFiltros}
                  className="mt-1 text-xs text-charcoal/60 underline-offset-2 hover:text-paprika hover:underline"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* navegação por semana — opcional, desligada por padrão */}
        <div className="ml-auto flex items-center gap-2">
          {modoSemana && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setInicioSemana((s) => addDays(s, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[110px] text-center text-xs font-medium text-charcoal">
                {format(inicioSemana, 'dd/MM')} – {format(addDays(inicioSemana, 6), 'dd/MM')}
              </span>
              <Button variant="outline" size="icon" onClick={() => setInicioSemana((s) => addDays(s, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <label className="flex items-center gap-1.5 text-xs font-medium text-charcoal">
            <input
              type="checkbox"
              checked={modoSemana}
              onChange={(e) => setModoSemana(e.target.checked)}
              className="h-4 w-4 accent-paprika"
            />
            Ver só 1 semana
          </label>
        </div>
      </div>

      {filtrosAtivos > 0 && (
        <div className="mb-2 flex shrink-0 items-center gap-2 text-xs text-charcoal/70">
          Mostrando {leadsFiltrados.length} de {leads.length} leads
          <button
            onClick={limparFiltros}
            className="flex items-center gap-0.5 rounded-full bg-dust/40 px-2 py-0.5 hover:bg-dust/60"
          >
            <X className="h-3 w-3" /> limpar
          </button>
        </div>
      )}

      {/* board: rolagem horizontal sempre acessível, sem depender de descer a página */}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-3 scrollbar-thin">
          <div className="flex h-full gap-3">
            {KANBAN_ORDER.map((status) => (
              <Coluna
                key={status}
                status={status}
                leads={porStatus.get(status) ?? []}
                totalSemFiltro={totalPorStatusSemFiltro.get(status) ?? 0}
                visiveis={visiveisPorColuna[status]}
                onCarregarMais={() =>
                  setVisiveisPorColuna((prev) => ({ ...prev, [status]: prev[status] + TAMANHO_PAGINA }))
                }
                onOpenLead={(lead) => setDetalheId(lead.id)}
                onTemperaturaChange={(lead, t) => updateLead(lead.id, { temperatura: t })}
              />
            ))}
          </div>
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
