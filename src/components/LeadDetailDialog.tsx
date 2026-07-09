import { useState } from 'react'
import { format } from 'date-fns'
import { BookOpen, Check, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TemperatureSelector } from '@/components/TemperatureSelector'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'
import { STATUS_LABELS, STATUSES, TIPOS_INTERACAO, type Lead } from '@/lib/types'

interface Props {
  lead: Lead | null
  onClose: () => void
}

function paraInputDate(iso: string | null): string {
  return iso ? format(new Date(iso), 'yyyy-MM-dd') : ''
}

function paraInputDateTime(iso: string | null): string {
  return iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : ''
}

export function LeadDetailDialog({ lead, onClose }: Props) {
  const { updateLead, deleteLead, addInteracao, segmentos, plataformas } = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [novaInteracaoTipo, setNovaInteracaoTipo] = useState('MENSAGEM_ENVIADA')
  const [novaInteracaoDesc, setNovaInteracaoDesc] = useState('')

  if (!lead) return null

  const salvarCampo = (patch: Partial<Lead>) => {
    updateLead(lead.id, patch).catch(() =>
      showToast({ title: 'Erro ao salvar', description: 'Tente novamente.' }),
    )
  }

  // Campo type="date" (yyyy-MM-dd, sem hora): ancora ao meio-dia local antes
  // de converter para ISO. Sem isso, "new Date('2026-07-15')" é interpretado
  // como meia-noite em UTC, que em fusos como o do Brasil (UTC-3) já é o dia
  // anterior — fazendo a data salva "voltar" um dia e o follow-up continuar
  // aparecendo como vencido mesmo depois de atualizado.
  const salvarSoData = (campo: keyof Lead, valor: string) => {
    salvarCampo({ [campo]: valor ? new Date(`${valor}T12:00:00`).toISOString() : null } as Partial<Lead>)
  }

  // Campo type="datetime-local" (já tem hora própria, sem sufixo de fuso) —
  // não precisa da âncora acima.
  const salvarDataHora = (campo: keyof Lead, valor: string) => {
    salvarCampo({ [campo]: valor ? new Date(valor).toISOString() : null } as Partial<Lead>)
  }

  async function registrarInteracao() {
    if (!lead) return
    await addInteracao(lead.id, novaInteracaoTipo, novaInteracaoDesc.trim() || undefined)
    setNovaInteracaoDesc('')
  }

  async function excluir() {
    if (!lead) return
    if (!window.confirm(`Excluir o lead ${lead.nomePerfil}? Essa ação não pode ser desfeita.`)) return
    await deleteLead(lead.id)
    onClose()
    showToast({ title: 'Lead excluído' })
  }

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <DialogTitle className="truncate">{lead.nomePerfil}</DialogTitle>
            <TemperatureSelector
              value={lead.temperatura}
              onChange={(t) => salvarCampo({ temperatura: t })}
            />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">Nome do perfil</label>
            <Input
              defaultValue={lead.nomePerfil}
              onBlur={(e) => e.target.value !== lead.nomePerfil && salvarCampo({ nomePerfil: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">Link do perfil</label>
            <Input
              defaultValue={lead.linkPerfil}
              onBlur={(e) => e.target.value !== lead.linkPerfil && salvarCampo({ linkPerfil: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">WhatsApp</label>
            <Input
              type="tel"
              placeholder="(11) 91234-5678"
              defaultValue={lead.whatsapp ?? ''}
              onBlur={(e) =>
                e.target.value !== (lead.whatsapp ?? '') &&
                salvarCampo({ whatsapp: e.target.value.trim() || null })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">Status</label>
            <Select
              value={lead.status}
              onChange={(e) => salvarCampo({ status: e.target.value as Lead['status'] })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">Segmento</label>
            <Select
              value={lead.segmentoNicho ?? ''}
              onChange={(e) => salvarCampo({ segmentoNicho: e.target.value || null })}
            >
              <option value="">— sem segmento —</option>
              {segmentos.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">Plataforma</label>
            <Select
              value={lead.plataformaContato}
              onChange={(e) => salvarCampo({ plataformaContato: e.target.value })}
            >
              {plataformas.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">1º contato</label>
            <Input
              type="date"
              defaultValue={paraInputDate(lead.dataPrimeiroContato)}
              onBlur={(e) => salvarSoData('dataPrimeiroContato', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-charcoal">
              Follow-up 1
              {lead.followup1Confirmado && (
                <span className="flex items-center gap-0.5 rounded-full bg-paprika/10 px-1.5 py-0.5 text-[10px] font-semibold text-paprika" title="Confirmado — não conta mais como atrasado">
                  <Check className="h-2.5 w-2.5" /> confirmado
                </span>
              )}
            </label>
            <Input
              type="date"
              defaultValue={paraInputDate(lead.followup1Data)}
              onBlur={(e) => salvarSoData('followup1Data', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-charcoal">
              Follow-up 2
              {lead.followup2Confirmado && (
                <span className="flex items-center gap-0.5 rounded-full bg-paprika/10 px-1.5 py-0.5 text-[10px] font-semibold text-paprika" title="Confirmado — não conta mais como atrasado">
                  <Check className="h-2.5 w-2.5" /> confirmado
                </span>
              )}
            </label>
            <Input
              type="date"
              defaultValue={paraInputDate(lead.followup2Data)}
              onBlur={(e) => salvarSoData('followup2Data', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">Reunião</label>
            <Input
              type="datetime-local"
              defaultValue={paraInputDateTime(lead.dataReuniao)}
              onBlur={(e) => salvarDataHora('dataReuniao', e.target.value)}
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={lead.propostaEnviada}
                onChange={(e) => salvarCampo({ propostaEnviada: e.target.checked })}
                className="h-4 w-4 accent-paprika"
              />
              Proposta enviada
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              className="w-32"
              defaultValue={lead.valorProposta ?? ''}
              onBlur={(e) =>
                salvarCampo({ valorProposta: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-charcoal">Observações</label>
          <Textarea
            defaultValue={lead.observacoes ?? ''}
            placeholder="Anotações livres sobre este lead…"
            onBlur={(e) =>
              e.target.value !== (lead.observacoes ?? '') &&
              salvarCampo({ observacoes: e.target.value || null })
            }
          />
        </div>

        {/* Histórico de interações */}
        <div className="rounded-xl border border-dust/70 bg-white/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal">
            Histórico de contatos
          </p>
          <div className="mb-3 flex gap-2">
            <Select
              className="w-44"
              value={novaInteracaoTipo}
              onChange={(e) => setNovaInteracaoTipo(e.target.value)}
            >
              {TIPOS_INTERACAO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Descrição (opcional)"
              value={novaInteracaoDesc}
              onChange={(e) => setNovaInteracaoDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && registrarInteracao()}
            />
            <Button size="sm" className="h-9 shrink-0" onClick={registrarInteracao}>
              Registrar
            </Button>
          </div>
          {lead.interacoes?.length ? (
            <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto scrollbar-thin">
              {lead.interacoes.map((i) => (
                <li key={i.id} className="flex items-baseline gap-2 text-xs">
                  <span className="shrink-0 tabular-nums text-charcoal/60">
                    {format(new Date(i.data), 'dd/MM/yy HH:mm')}
                  </span>
                  <span className="shrink-0 font-medium text-ink">
                    {TIPOS_INTERACAO.find((t) => t.value === i.tipo)?.label ?? i.tipo}
                  </span>
                  {i.descricao && <span className="text-charcoal">— {i.descricao}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-charcoal/60">Nenhuma interação registrada ainda.</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="danger" size="sm" onClick={excluir}>
            <Trash2 className="h-3.5 w-3.5" /> Excluir lead
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              navigate(`/playbook?lead=${lead.id}`)
            }}
          >
            <BookOpen className="h-3.5 w-3.5" /> Abrir Playbook com este lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
