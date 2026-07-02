import { useMemo, useState } from 'react'
import { addDays, format, isSameMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, CalendarClock, TrendingUp, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LeadDetailDialog } from '@/components/LeadDetailDialog'
import { useData } from '@/store/DataContext'
import { isFollowupOverdue, overdueFollowupDate } from '@/lib/leadUtils'
import { STATUS_LABELS, STATUSES } from '@/lib/types'

const ORDEM_FUNIL = STATUSES.filter((s) => s !== 'DESCARTADO' && s !== 'NAO_RESPONDEU')

export function Dashboard() {
  const { leads } = useData()
  const [detalheId, setDetalheId] = useState<number | null>(null)

  const agora = new Date()

  const metricas = useMemo(() => {
    const ativos = leads.filter((l) => l.status !== 'FECHADO' && l.status !== 'DESCARTADO')
    const reunioesProximas = leads.filter((l) => {
      if (!l.dataReuniao) return false
      const d = new Date(l.dataReuniao)
      return d >= agora && d <= addDays(agora, 7)
    })
    const fechados = leads.filter((l) => l.status === 'FECHADO')
    const taxaGeral = leads.length > 0 ? (fechados.length / leads.length) * 100 : 0

    // fechamento mensal (por mês de criação do lead)
    const mesAtual = agora
    const mesAnterior = subMonths(agora, 1)
    const doMes = leads.filter((l) => isSameMonth(new Date(l.criadoEm), mesAtual))
    const doMesAnterior = leads.filter((l) => isSameMonth(new Date(l.criadoEm), mesAnterior))
    const fechadosMes = doMes.filter((l) => l.status === 'FECHADO')
    const fechadosMesAnterior = doMesAnterior.filter((l) => l.status === 'FECHADO')
    const taxaMes = doMes.length > 0 ? (fechadosMes.length / doMes.length) * 100 : 0

    const variacao = (atual: number, anterior: number): number | null =>
      anterior === 0 ? null : ((atual - anterior) / anterior) * 100

    return {
      ativos: ativos.length,
      reunioesProximas: reunioesProximas.length,
      taxaGeral,
      doMes: doMes.length,
      doMesAnterior: doMesAnterior.length,
      fechadosMes: fechadosMes.length,
      fechadosMesAnterior: fechadosMesAnterior.length,
      taxaMes,
      variacaoAdicionados: variacao(doMes.length, doMesAnterior.length),
      variacaoFechados: variacao(fechadosMes.length, fechadosMesAnterior.length),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads])

  const dadosFunil = useMemo(
    () =>
      ORDEM_FUNIL.map((s) => ({
        status: STATUS_LABELS[s],
        total: leads.filter((l) => l.status === s).length,
      })),
    [leads],
  )

  const atrasados = useMemo(
    () =>
      leads
        .filter(isFollowupOverdue)
        .sort(
          (a, b) =>
            (overdueFollowupDate(a)?.getTime() ?? 0) - (overdueFollowupDate(b)?.getTime() ?? 0),
        ),
    [leads],
  )

  const leadDetalhe = detalheId !== null ? (leads.find((l) => l.id === detalheId) ?? null) : null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl uppercase tracking-wide text-ink">Dashboard</h1>

      {/* cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-paprika" /> Leads ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl text-ink">{metricas.ativos}</p>
            <p className="mt-1 text-xs text-charcoal/70">fora de Fechado / Descartado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-paprika" /> Reuniões (próximos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl text-ink">{metricas.reunioesProximas}</p>
            <p className="mt-1 text-xs text-charcoal/70">agendadas para esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-paprika" /> Taxa de conversão geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl text-ink">{metricas.taxaGeral.toFixed(1)}%</p>
            <p className="mt-1 text-xs text-charcoal/70">leads fechados sobre o total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* funil por status */}
        <Card>
          <CardHeader>
            <CardTitle>Funil por status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosFunil}
                  layout="vertical"
                  margin={{ top: 0, right: 36, bottom: 0, left: 8 }}
                >
                  <CartesianGrid horizontal={false} stroke="#CCC5B9" strokeOpacity={0.4} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={130}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#403D39', fontSize: 12 }}
                  />
                  <Bar dataKey="total" barSize={18} radius={[0, 4, 4, 0]}>
                    {dadosFunil.map((d) => (
                      <Cell key={d.status} fill="#E85E28" />
                    ))}
                    <LabelList
                      dataKey="total"
                      position="right"
                      style={{ fill: '#252422', fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* follow-ups atrasados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-paprika" /> Follow-ups atrasados
              <span className="ml-auto rounded-full bg-paprika/10 px-2 py-0.5 text-xs font-bold text-paprika">
                {atrasados.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atrasados.length === 0 ? (
              <p className="py-8 text-center text-sm text-charcoal/60">
                Nenhum follow-up atrasado. 🎉
              </p>
            ) : (
              <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto scrollbar-thin">
                {atrasados.map((l) => {
                  const data = overdueFollowupDate(l)
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => setDetalheId(l.id)}
                        className="flex w-full items-center gap-2 rounded-lg border border-paprika/30 bg-paprika/5 px-3 py-2 text-left transition-colors hover:bg-paprika/10"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                          {l.nomePerfil}
                        </span>
                        {l.segmentoNicho && <Badge variant="outline">{l.segmentoNicho}</Badge>}
                        <span className="shrink-0 text-xs font-semibold text-paprika">
                          desde {data ? format(data, 'dd/MM') : '—'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* fechamento mensal */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fechamento mensal —{' '}
            <span className="capitalize">{format(agora, 'MMMM', { locale: ptBR })}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Indicador
              rotulo="Leads adicionados no mês"
              valor={String(metricas.doMes)}
              variacao={metricas.variacaoAdicionados}
              baseAnterior={metricas.doMesAnterior}
            />
            <Indicador
              rotulo="Fechados no mês"
              valor={String(metricas.fechadosMes)}
              variacao={metricas.variacaoFechados}
              baseAnterior={metricas.fechadosMesAnterior}
            />
            <Indicador
              rotulo="Taxa de conversão do mês"
              valor={`${metricas.taxaMes.toFixed(1)}%`}
              variacao={null}
              baseAnterior={null}
            />
          </div>
        </CardContent>
      </Card>

      <LeadDetailDialog lead={leadDetalhe} onClose={() => setDetalheId(null)} />
    </div>
  )
}

function Indicador({
  rotulo,
  valor,
  variacao,
  baseAnterior,
}: {
  rotulo: string
  valor: string
  variacao: number | null
  baseAnterior: number | null
}) {
  return (
    <div className="rounded-xl border border-dust/60 bg-cream p-4">
      <p className="text-xs font-medium text-charcoal">{rotulo}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="font-heading text-3xl text-ink">{valor}</p>
        {variacao !== null && (
          <span
            className={
              variacao >= 0 ? 'text-sm font-semibold text-paprika' : 'text-sm font-semibold text-charcoal'
            }
          >
            {variacao >= 0 ? '▲' : '▼'} {Math.abs(variacao).toFixed(0)}%
          </span>
        )}
        {variacao === null && baseAnterior !== null && (
          <span className="text-xs text-charcoal/60">sem base no mês anterior</span>
        )}
      </div>
      {baseAnterior !== null && (
        <p className="mt-1 text-[11px] text-charcoal/60">mês anterior: {baseAnterior}</p>
      )}
    </div>
  )
}
