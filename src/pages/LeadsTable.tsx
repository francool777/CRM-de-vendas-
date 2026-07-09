import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Check, Download, ExternalLink, Pencil, Search, Trash2, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/StatusBadge'
import { TemperatureSelector } from '@/components/TemperatureSelector'
import { ImportDialog } from '@/components/ImportDialog'
import { LeadDetailDialog } from '@/components/LeadDetailDialog'
import { BulkEditDialog } from '@/components/BulkEditDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useData } from '@/store/DataContext'
import { cn } from '@/lib/utils'
import { isFollowupOverdue } from '@/lib/leadUtils'
import {
  STATUS_LABELS,
  STATUSES,
  TEMPERATURA_LABELS,
  TEMPERATURAS,
  type Lead,
  type Status,
} from '@/lib/types'

// ---- células com edição inline ----

function CelulaTexto({
  valor,
  onSalvar,
  className,
}: {
  valor: string
  onSalvar: (v: string) => void
  className?: string
}) {
  const [editando, setEditando] = useState(false)
  if (editando) {
    return (
      <Input
        autoFocus
        defaultValue={valor}
        className="h-7 min-w-[8rem] px-2 text-xs"
        onBlur={(e) => {
          if (e.target.value !== valor) onSalvar(e.target.value)
          setEditando(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') setEditando(false)
        }}
      />
    )
  }
  return (
    <button
      onClick={() => setEditando(true)}
      className={cn(
        'block w-full truncate rounded px-1 py-0.5 text-left hover:bg-dust/30',
        !valor && 'text-charcoal/40',
        className,
      )}
      title="Clique para editar"
    >
      {valor || '—'}
    </button>
  )
}

function CelulaData({
  valor,
  onSalvar,
  confirmado,
}: {
  valor: string | null
  onSalvar: (iso: string | null) => void
  confirmado?: boolean
}) {
  const [editando, setEditando] = useState(false)
  if (editando) {
    return (
      <Input
        autoFocus
        type="date"
        defaultValue={valor ? format(new Date(valor), 'yyyy-MM-dd') : ''}
        className="h-7 w-32 px-2 text-xs"
        onBlur={(e) => {
          onSalvar(e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : null)
          setEditando(false)
        }}
      />
    )
  }
  return (
    <button
      onClick={() => setEditando(true)}
      title={confirmado ? 'Confirmado — não conta mais como atrasado' : undefined}
      className={cn(
        'flex items-center gap-1 rounded px-1 py-0.5 tabular-nums hover:bg-dust/30',
        !valor && 'text-charcoal/40',
      )}
    >
      {valor ? format(new Date(valor), 'dd/MM/yy') : '—'}
      {confirmado && <Check className="h-3 w-3 text-paprika" />}
    </button>
  )
}

// ---- página ----

export function LeadsTable() {
  const { leads, updateLead, deleteLead, deleteLeads, segmentos, plataformas } = useData()

  const [busca, setBusca] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fSegmento, setFSegmento] = useState('')
  const [fTemperatura, setFTemperatura] = useState('')
  const [fPlataforma, setFPlataforma] = useState('')
  const [fDe, setFDe] = useState('')
  const [fAte, setFAte] = useState('')
  const [importAberto, setImportAberto] = useState(false)
  const [detalheId, setDetalheId] = useState<number | null>(null)
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [edicaoLoteAberta, setEdicaoLoteAberta] = useState(false)
  const [confirmarExcluirSelecionados, setConfirmarExcluirSelecionados] = useState(false)
  const [confirmarExcluirTodos, setConfirmarExcluirTodos] = useState(false)

  const filtrados = useMemo(() => {
    return leads.filter((l) => {
      if (
        busca &&
        !l.nomePerfil.toLowerCase().includes(busca.toLowerCase()) &&
        !(l.whatsapp ?? '').toLowerCase().includes(busca.toLowerCase())
      )
        return false
      if (fStatus && l.status !== fStatus) return false
      if (fSegmento && l.segmentoNicho !== fSegmento) return false
      if (fTemperatura && l.temperatura !== fTemperatura) return false
      if (fPlataforma && l.plataformaContato !== fPlataforma) return false
      const criado = new Date(l.criadoEm)
      if (fDe && criado < new Date(`${fDe}T00:00:00`)) return false
      if (fAte && criado > new Date(`${fAte}T23:59:59`)) return false
      return true
    })
  }, [leads, busca, fStatus, fSegmento, fTemperatura, fPlataforma, fDe, fAte])

  // sempre que os filtros mudam, descarta seleções que saíram da lista visível
  useEffect(() => {
    setSelecionados((prev) => {
      const idsVisiveis = new Set(filtrados.map((l) => l.id))
      const proximo = new Set([...prev].filter((id) => idsVisiveis.has(id)))
      return proximo.size === prev.size ? prev : proximo
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrados])

  const todosVisiveisSelecionados =
    filtrados.length > 0 && filtrados.every((l) => selecionados.has(l.id))
  const algunsSelecionados = selecionados.size > 0 && !todosVisiveisSelecionados

  const checkboxCabecalhoRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (checkboxCabecalhoRef.current) {
      checkboxCabecalhoRef.current.indeterminate = algunsSelecionados
    }
  }, [algunsSelecionados])

  function alternarSelecaoTodos() {
    if (todosVisiveisSelecionados) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(filtrados.map((l) => l.id)))
    }
  }

  function alternarSelecao(id: number) {
    setSelecionados((prev) => {
      const proximo = new Set(prev)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  async function excluirSelecionados() {
    await deleteLeads([...selecionados])
    setSelecionados(new Set())
  }

  async function excluirTodos() {
    await deleteLeads(leads.map((l) => l.id))
    setSelecionados(new Set())
  }

  const leadDetalhe = detalheId !== null ? (leads.find((l) => l.id === detalheId) ?? null) : null

  function exportarCSV() {
    const csv = Papa.unparse(
      filtrados.map((l) => ({
        nome_perfil: l.nomePerfil,
        link_perfil: l.linkPerfil,
        whatsapp: l.whatsapp ?? '',
        plataforma: l.plataformaContato,
        segmento: l.segmentoNicho ?? '',
        status: l.status,
        temperatura: l.temperatura,
        primeiro_contato: l.dataPrimeiroContato ? format(new Date(l.dataPrimeiroContato), 'dd/MM/yyyy') : '',
        followup_1: l.followup1Data ? format(new Date(l.followup1Data), 'dd/MM/yyyy') : '',
        followup_2: l.followup2Data ? format(new Date(l.followup2Data), 'dd/MM/yyyy') : '',
        reuniao: l.dataReuniao ? format(new Date(l.dataReuniao), 'dd/MM/yyyy HH:mm') : '',
        proposta_enviada: l.propostaEnviada ? 'sim' : 'não',
        valor_proposta: l.valorProposta ?? '',
        observacoes: l.observacoes ?? '',
        criado_em: format(new Date(l.criadoEm), 'dd/MM/yyyy'),
      })),
    )
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function excluir(lead: Lead) {
    if (window.confirm(`Excluir o lead ${lead.nomePerfil}?`)) await deleteLead(lead.id)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl uppercase tracking-wide text-ink">
          Leads <span className="text-base text-charcoal/60">({filtrados.length})</span>
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportAberto(true)}>
            <Upload className="h-3.5 w-3.5" /> Importar
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmarExcluirTodos(true)}
            disabled={leads.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir todos
          </Button>
        </div>
      </div>

      {/* barra de ações em massa — aparece só quando há seleção */}
      {selecionados.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-paprika/40 bg-paprika/10 px-4 py-2">
          <span className="text-sm font-medium text-ink">
            {selecionados.size} selecionado{selecionados.size === 1 ? '' : 's'}
          </span>
          <Button variant="outline" size="sm" onClick={() => setEdicaoLoteAberta(true)}>
            <Pencil className="h-3.5 w-3.5" /> Editar selecionados
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmarExcluirSelecionados(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Excluir selecionados
          </Button>
          <button
            onClick={() => setSelecionados(new Set())}
            className="ml-auto text-xs text-charcoal/60 underline-offset-2 hover:text-ink hover:underline"
          >
            limpar seleção
          </button>
        </div>
      )}

      {/* filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal/50" />
          <Input
            placeholder="Buscar por nome ou WhatsApp…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-52 pl-8"
          />
        </div>
        <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-44">
          <option value="">Status: todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select value={fSegmento} onChange={(e) => setFSegmento(e.target.value)} className="w-44">
          <option value="">Segmento: todos</option>
          {segmentos.map((s) => (
            <option key={s.id} value={s.nome}>
              {s.nome}
            </option>
          ))}
        </Select>
        <Select value={fTemperatura} onChange={(e) => setFTemperatura(e.target.value)} className="w-40">
          <option value="">Temp.: todas</option>
          {TEMPERATURAS.map((t) => (
            <option key={t} value={t}>
              {TEMPERATURA_LABELS[t]}
            </option>
          ))}
        </Select>
        <Select value={fPlataforma} onChange={(e) => setFPlataforma(e.target.value)} className="w-44">
          <option value="">Plataforma: todas</option>
          {plataformas.map((p) => (
            <option key={p.id} value={p.nome}>
              {p.nome}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-1 text-xs text-charcoal">
          <Input type="date" value={fDe} onChange={(e) => setFDe(e.target.value)} className="w-36" />
          <span>até</span>
          <Input type="date" value={fAte} onChange={(e) => setFAte(e.target.value)} className="w-36" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-dust/70 bg-white/70 shadow-card scrollbar-thin">
        <table className="w-full min-w-[1100px] text-xs">
          <thead>
            <tr className="border-b border-dust/70 text-left text-[11px] uppercase tracking-wide text-charcoal">
              <th className="px-3 py-2.5">
                <input
                  ref={checkboxCabecalhoRef}
                  type="checkbox"
                  checked={todosVisiveisSelecionados}
                  onChange={alternarSelecaoTodos}
                  className="h-4 w-4 accent-paprika"
                  title="Selecionar todos os leads filtrados"
                />
              </th>
              <th className="px-3 py-2.5">Perfil</th>
              <th className="px-2 py-2.5">WhatsApp</th>
              <th className="px-2 py-2.5">Plataforma</th>
              <th className="px-2 py-2.5">Segmento</th>
              <th className="px-2 py-2.5">Status</th>
              <th className="px-2 py-2.5">Temp.</th>
              <th className="px-2 py-2.5">1º contato</th>
              <th className="px-2 py-2.5">Follow-up 1</th>
              <th className="px-2 py-2.5">Follow-up 2</th>
              <th className="px-2 py-2.5">Reunião</th>
              <th className="px-2 py-2.5">Proposta</th>
              <th className="px-2 py-2.5">Valor</th>
              <th className="px-2 py-2.5">Observações</th>
              <th className="px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((l) => (
              <tr
                key={l.id}
                className={cn(
                  'border-b border-dust/40 transition-colors hover:bg-dust/15',
                  selecionados.has(l.id) && 'bg-paprika/5',
                  isFollowupOverdue(l) && 'border-l-4 border-l-paprika',
                )}
              >
                <td className="px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={selecionados.has(l.id)}
                    onChange={() => alternarSelecao(l.id)}
                    className="h-4 w-4 accent-paprika"
                  />
                </td>
                <td className="max-w-[180px] px-3 py-1.5 font-medium">
                  <div className="flex items-center gap-1">
                    <CelulaTexto valor={l.nomePerfil} onSalvar={(v) => updateLead(l.id, { nomePerfil: v })} />
                    {l.linkPerfil && (
                      <a href={l.linkPerfil} target="_blank" rel="noreferrer" className="shrink-0 text-charcoal/50 hover:text-paprika">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <CelulaTexto
                    valor={l.whatsapp ?? ''}
                    onSalvar={(v) => updateLead(l.id, { whatsapp: v.trim() || null })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Select
                    value={l.plataformaContato}
                    onChange={(e) => updateLead(l.id, { plataformaContato: e.target.value })}
                    className="h-7 w-24 border-transparent bg-transparent px-1 text-xs shadow-none"
                  >
                    {plataformas.map((p) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <Select
                    value={l.segmentoNicho ?? ''}
                    onChange={(e) => updateLead(l.id, { segmentoNicho: e.target.value || null })}
                    className="h-7 w-32 border-transparent bg-transparent px-1 text-xs shadow-none"
                  >
                    <option value="">—</option>
                    {segmentos.map((s) => (
                      <option key={s.id} value={s.nome}>
                        {s.nome}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <Select
                    value={l.status}
                    onChange={(e) => updateLead(l.id, { status: e.target.value as Status })}
                    className="h-7 w-40 border-transparent bg-transparent px-1 text-xs shadow-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <TemperatureSelector
                    size="sm"
                    value={l.temperatura}
                    onChange={(t) => updateLead(l.id, { temperatura: t })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <CelulaData valor={l.dataPrimeiroContato} onSalvar={(v) => updateLead(l.id, { dataPrimeiroContato: v })} />
                </td>
                <td className="px-2 py-1.5">
                  <CelulaData
                    valor={l.followup1Data}
                    confirmado={l.followup1Confirmado}
                    onSalvar={(v) => updateLead(l.id, { followup1Data: v })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <CelulaData
                    valor={l.followup2Data}
                    confirmado={l.followup2Confirmado}
                    onSalvar={(v) => updateLead(l.id, { followup2Data: v })}
                  />
                </td>
                <td className="px-2 py-1.5 tabular-nums">
                  {l.dataReuniao ? format(new Date(l.dataReuniao), 'dd/MM/yy HH:mm') : '—'}
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={l.propostaEnviada}
                    onChange={(e) => updateLead(l.id, { propostaEnviada: e.target.checked })}
                    className="h-4 w-4 accent-paprika"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <CelulaTexto
                    valor={l.valorProposta !== null ? String(l.valorProposta) : ''}
                    onSalvar={(v) => updateLead(l.id, { valorProposta: v ? Number(v.replace(',', '.')) : null })}
                  />
                </td>
                <td className="max-w-[200px] px-2 py-1.5">
                  <CelulaTexto
                    valor={l.observacoes ?? ''}
                    onSalvar={(v) => updateLead(l.id, { observacoes: v || null })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <StatusBadge status={l.status} className="hidden" />
                    <button
                      onClick={() => setDetalheId(l.id)}
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-charcoal hover:bg-dust/40"
                    >
                      abrir
                    </button>
                    <button onClick={() => excluir(l)} className="text-charcoal/40 hover:text-paprika">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={15} className="px-3 py-10 text-center text-sm text-charcoal/60">
                  Nenhum lead encontrado. Ajuste os filtros ou cadastre um novo lead.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ImportDialog open={importAberto} onOpenChange={setImportAberto} />
      <LeadDetailDialog lead={leadDetalhe} onClose={() => setDetalheId(null)} />
      <BulkEditDialog
        open={edicaoLoteAberta}
        onOpenChange={setEdicaoLoteAberta}
        leadIds={[...selecionados]}
        onDone={() => setSelecionados(new Set())}
      />
      <ConfirmDialog
        open={confirmarExcluirSelecionados}
        onOpenChange={setConfirmarExcluirSelecionados}
        title="Excluir leads selecionados?"
        description={`Isso vai remover permanentemente ${selecionados.size} lead${selecionados.size === 1 ? '' : 's'} selecionado${selecionados.size === 1 ? '' : 's'}. Você pode desfazer com Ctrl+Z logo em seguida.`}
        confirmLabel="Excluir selecionados"
        onConfirm={excluirSelecionados}
      />
      <ConfirmDialog
        open={confirmarExcluirTodos}
        onOpenChange={setConfirmarExcluirTodos}
        title="Tem certeza de que deseja excluir todos os leads?"
        description={`Esta ação removerá permanentemente todos os ${leads.length} registros cadastrados (não só os filtrados nesta tela). Você pode desfazer com Ctrl+Z logo em seguida.`}
        confirmLabel="Excluir todos"
        onConfirm={excluirTodos}
      />
    </div>
  )
}
