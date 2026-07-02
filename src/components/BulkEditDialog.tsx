import { useEffect, useState } from 'react'
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
import { cn } from '@/lib/utils'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'
import { STATUS_LABELS, STATUSES, TEMPERATURA_LABELS, TEMPERATURAS, type Lead } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadIds: number[]
  onDone?: () => void
}

type CampoLote =
  | 'status'
  | 'segmentoNicho'
  | 'plataformaContato'
  | 'temperatura'
  | 'dataPrimeiroContato'
  | 'followup1Data'
  | 'followup2Data'
  | 'propostaEnviada'
  | 'valorProposta'

// Linha genérica: checkbox "aplicar" + o controle do campo (só habilitado
// quando marcado) — assim nenhum lead perde dado por engano.
function LinhaCampo({
  label,
  ativo,
  onToggle,
  children,
}: {
  label: string
  ativo: boolean
  onToggle: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dust/60 bg-white/60 px-3 py-2">
      <label className="flex w-40 shrink-0 items-center gap-2 text-sm font-medium text-charcoal">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 accent-paprika"
        />
        {label}
      </label>
      <div className={cn('flex-1', !ativo && 'pointer-events-none opacity-40')}>{children}</div>
    </div>
  )
}

export function BulkEditDialog({ open, onOpenChange, leadIds, onDone }: Props) {
  const { segmentos, plataformas, bulkUpdateLeads } = useData()
  const { showToast } = useToast()

  const [ativos, setAtivos] = useState<Record<CampoLote, boolean>>({} as Record<CampoLote, boolean>)
  const [status, setStatus] = useState<Lead['status']>('LEAD')
  const [segmentoNicho, setSegmentoNicho] = useState('')
  const [plataformaContato, setPlataformaContato] = useState('')
  const [temperatura, setTemperatura] = useState<Lead['temperatura']>('MORNO')
  const [dataPrimeiroContato, setDataPrimeiroContato] = useState('')
  const [followup1Data, setFollowup1Data] = useState('')
  const [followup2Data, setFollowup2Data] = useState('')
  const [propostaEnviada, setPropostaEnviada] = useState(false)
  const [valorProposta, setValorProposta] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!open) {
      setAtivos({} as Record<CampoLote, boolean>)
      setSalvando(false)
    }
  }, [open])

  function toggle(campo: CampoLote, v: boolean) {
    setAtivos((prev) => ({ ...prev, [campo]: v }))
  }

  const algumAtivo = Object.values(ativos).some(Boolean)

  async function salvar() {
    const patch: Partial<Lead> = {}
    if (ativos.status) patch.status = status
    if (ativos.segmentoNicho) patch.segmentoNicho = segmentoNicho || null
    if (ativos.plataformaContato) patch.plataformaContato = plataformaContato
    if (ativos.temperatura) patch.temperatura = temperatura
    if (ativos.dataPrimeiroContato)
      patch.dataPrimeiroContato = dataPrimeiroContato ? new Date(`${dataPrimeiroContato}T12:00:00`).toISOString() : null
    if (ativos.followup1Data)
      patch.followup1Data = followup1Data ? new Date(`${followup1Data}T12:00:00`).toISOString() : null
    if (ativos.followup2Data)
      patch.followup2Data = followup2Data ? new Date(`${followup2Data}T12:00:00`).toISOString() : null
    if (ativos.propostaEnviada) patch.propostaEnviada = propostaEnviada
    if (ativos.valorProposta) patch.valorProposta = valorProposta ? Number(valorProposta.replace(',', '.')) : null

    if (Object.keys(patch).length === 0) return
    setSalvando(true)
    try {
      await bulkUpdateLeads(leadIds, patch)
      showToast({
        title: `${leadIds.length} lead${leadIds.length === 1 ? '' : 's'} atualizado${leadIds.length === 1 ? '' : 's'}!`,
        description: 'Ctrl+Z desfaz essa edição em lote.',
      })
      onOpenChange(false)
      onDone?.()
    } catch (e) {
      showToast({ title: 'Erro na edição em lote', description: String(e) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar em lote</DialogTitle>
          <DialogDescription>
            Marque só os campos que quer alterar em {leadIds.length} lead
            {leadIds.length === 1 ? '' : 's'} selecionado{leadIds.length === 1 ? '' : 's'}. Campos
            não marcados ficam como estão.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin">
          <LinhaCampo label="Status" ativo={!!ativos.status} onToggle={(v) => toggle('status', v)}>
            <Select value={status} onChange={(e) => setStatus(e.target.value as Lead['status'])}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </LinhaCampo>

          <LinhaCampo
            label="Segmento"
            ativo={!!ativos.segmentoNicho}
            onToggle={(v) => toggle('segmentoNicho', v)}
          >
            <Select value={segmentoNicho} onChange={(e) => setSegmentoNicho(e.target.value)}>
              <option value="">— sem segmento —</option>
              {segmentos.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </LinhaCampo>

          <LinhaCampo
            label="Plataforma"
            ativo={!!ativos.plataformaContato}
            onToggle={(v) => toggle('plataformaContato', v)}
          >
            <Select value={plataformaContato} onChange={(e) => setPlataformaContato(e.target.value)}>
              <option value="">— selecione —</option>
              {plataformas.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </LinhaCampo>

          <LinhaCampo
            label="Temperatura"
            ativo={!!ativos.temperatura}
            onToggle={(v) => toggle('temperatura', v)}
          >
            <Select value={temperatura} onChange={(e) => setTemperatura(e.target.value as Lead['temperatura'])}>
              {TEMPERATURAS.map((t) => (
                <option key={t} value={t}>
                  {TEMPERATURA_LABELS[t]}
                </option>
              ))}
            </Select>
          </LinhaCampo>

          <LinhaCampo
            label="Data de contato"
            ativo={!!ativos.dataPrimeiroContato}
            onToggle={(v) => toggle('dataPrimeiroContato', v)}
          >
            <Input type="date" value={dataPrimeiroContato} onChange={(e) => setDataPrimeiroContato(e.target.value)} />
          </LinhaCampo>

          <LinhaCampo
            label="Follow-up 1"
            ativo={!!ativos.followup1Data}
            onToggle={(v) => toggle('followup1Data', v)}
          >
            <Input type="date" value={followup1Data} onChange={(e) => setFollowup1Data(e.target.value)} />
          </LinhaCampo>

          <LinhaCampo
            label="Follow-up 2"
            ativo={!!ativos.followup2Data}
            onToggle={(v) => toggle('followup2Data', v)}
          >
            <Input type="date" value={followup2Data} onChange={(e) => setFollowup2Data(e.target.value)} />
          </LinhaCampo>

          <LinhaCampo
            label="Proposta enviada"
            ativo={!!ativos.propostaEnviada}
            onToggle={(v) => toggle('propostaEnviada', v)}
          >
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={propostaEnviada}
                onChange={(e) => setPropostaEnviada(e.target.checked)}
                className="h-4 w-4 accent-paprika"
              />
              Marcar como enviada
            </label>
          </LinhaCampo>

          <LinhaCampo
            label="Valor da proposta"
            ativo={!!ativos.valorProposta}
            onToggle={(v) => toggle('valorProposta', v)}
          >
            <Input
              type="number"
              step="0.01"
              placeholder="R$"
              value={valorProposta}
              onChange={(e) => setValorProposta(e.target.value)}
            />
          </LinhaCampo>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!algumAtivo || salvando}>
            {salvando
              ? 'Salvando…'
              : `Aplicar a ${leadIds.length} lead${leadIds.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
