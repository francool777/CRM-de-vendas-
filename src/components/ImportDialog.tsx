import { useRef, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'
import { STATUSES, TEMPERATURAS } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CAMPOS_ALVO = [
  { key: 'nomePerfil', label: 'Nome do perfil', dicas: ['nome', 'perfil', 'usuario', 'handle'] },
  { key: 'linkPerfil', label: 'Link do perfil', dicas: ['link', 'url', 'instagram'] },
  { key: 'plataformaContato', label: 'Plataforma', dicas: ['plataforma'] },
  { key: 'segmentoNicho', label: 'Segmento / nicho', dicas: ['segmento', 'nicho'] },
  { key: 'status', label: 'Status', dicas: ['status', 'etapa', 'fase'] },
  { key: 'temperatura', label: 'Temperatura', dicas: ['temperatura', 'temp'] },
  { key: 'dataPrimeiroContato', label: '1º contato', dicas: ['primeiro', 'contato'] },
  { key: 'followup1Data', label: 'Follow-up 1', dicas: ['follow-up 1', 'followup 1', 'follow up 1', 'fup1'] },
  { key: 'followup2Data', label: 'Follow-up 2', dicas: ['follow-up 2', 'followup 2', 'follow up 2', 'fup2'] },
  { key: 'dataReuniao', label: 'Data da reunião', dicas: ['reuniao', 'reunião', 'meeting'] },
  { key: 'propostaEnviada', label: 'Proposta enviada', dicas: ['proposta'] },
  { key: 'valorProposta', label: 'Valor da proposta', dicas: ['valor'] },
  { key: 'observacoes', label: 'Observações', dicas: ['obs', 'observa', 'nota'] },
] as const

type CampoAlvo = (typeof CAMPOS_ALVO)[number]['key']

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function adivinharMapeamento(colunas: string[]): Record<CampoAlvo, string> {
  const mapa = {} as Record<CampoAlvo, string>
  for (const campo of CAMPOS_ALVO) {
    const achou = colunas.find((c) => {
      const n = normalizar(c)
      return campo.dicas.some((d) => n.includes(normalizar(d)))
    })
    mapa[campo.key] = achou ?? ''
  }
  return mapa
}

function parseData(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (valor instanceof Date) return valor.toISOString()
  const s = String(valor).trim()
  // dd/mm/yyyy ou dd/mm/yy
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (br) {
    const ano = br[3].length === 2 ? `20${br[3]}` : br[3]
    const d = new Date(Number(ano), Number(br[2]) - 1, Number(br[1]), 12)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function parseBooleano(valor: unknown): boolean {
  const s = normalizar(String(valor ?? ''))
  return ['sim', 'true', '1', 'x', 'yes', 'enviada', 'enviado'].includes(s)
}

function parseEnum(valor: unknown, validos: readonly string[]): string | undefined {
  const s = normalizar(String(valor ?? ''))
    .replace(/\s+/g, '_')
    .toUpperCase()
  return validos.includes(s) ? s : undefined
}

export function ImportDialog({ open, onOpenChange }: Props) {
  const { importLeads } = useData()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [colunas, setColunas] = useState<string[]>([])
  const [linhas, setLinhas] = useState<Record<string, unknown>[]>([])
  const [mapeamento, setMapeamento] = useState<Record<CampoAlvo, string>>(
    {} as Record<CampoAlvo, string>,
  )
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [importando, setImportando] = useState(false)

  function reset() {
    setColunas([])
    setLinhas([])
    setNomeArquivo('')
    setImportando(false)
  }

  function carregarLinhas(rows: Record<string, unknown>[], nome: string) {
    if (rows.length === 0) {
      showToast({ title: 'Arquivo vazio', description: 'Nenhuma linha encontrada.' })
      return
    }
    const cols = Object.keys(rows[0])
    setColunas(cols)
    setLinhas(rows)
    setMapeamento(adivinharMapeamento(cols))
    setNomeArquivo(nome)
  }

  async function onArquivo(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv' || ext === 'txt') {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => carregarLinhas(res.data, file.name),
      })
    } else {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      carregarLinhas(rows, file.name)
    }
  }

  async function importar() {
    setImportando(true)
    try {
      const rows = linhas
        .map((linha) => {
          const r: Record<string, unknown> = {}
          for (const campo of CAMPOS_ALVO) {
            const coluna = mapeamento[campo.key]
            if (!coluna) continue
            const bruto = linha[coluna]
            switch (campo.key) {
              case 'dataPrimeiroContato':
              case 'followup1Data':
              case 'followup2Data':
              case 'dataReuniao':
                r[campo.key] = parseData(bruto)
                break
              case 'propostaEnviada':
                r[campo.key] = parseBooleano(bruto)
                break
              case 'valorProposta': {
                // aceita "R$ 1.500,00", "1500.50", "1500"
                const limpo = String(bruto ?? '').replace(/[^\d.,-]/g, '')
                const normalizado = limpo.includes(',')
                  ? limpo.replace(/\./g, '').replace(',', '.')
                  : limpo
                const n = Number(normalizado)
                r[campo.key] = limpo === '' || isNaN(n) ? null : n
                break
              }
              case 'status':
                r[campo.key] = parseEnum(bruto, STATUSES) ?? 'LEAD'
                break
              case 'temperatura':
                r[campo.key] = parseEnum(bruto, TEMPERATURAS) ?? 'MORNO'
                break
              default:
                r[campo.key] = String(bruto ?? '').trim() || null
            }
          }
          return r
        })
        .filter((r) => r.nomePerfil || r.linkPerfil)

      const importados = await importLeads(rows)
      showToast({
        title: `${importados} leads importados!`,
        description: `de ${linhas.length} linhas do arquivo ${nomeArquivo}`,
      })
      reset()
      onOpenChange(false)
    } catch (e) {
      showToast({ title: 'Erro na importação', description: String(e) })
      setImportando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar leads</DialogTitle>
          <DialogDescription>
            {colunas.length === 0
              ? 'Envie um arquivo CSV ou Excel (.xlsx). Sem limite de linhas.'
              : `${linhas.length} linhas em "${nomeArquivo}" — escolha qual coluna do arquivo corresponde a cada campo.`}
          </DialogDescription>
        </DialogHeader>

        {colunas.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-dust px-6 py-10 text-charcoal transition-colors hover:border-paprika hover:text-paprika"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Clique para escolher o arquivo</span>
            <span className="text-xs text-charcoal/60">.csv, .xlsx ou .xls</span>
          </button>
        ) : (
          <div className="grid max-h-[50vh] grid-cols-1 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-2">
            {CAMPOS_ALVO.map((campo) => (
              <div key={campo.key} className="flex items-center justify-between gap-2 rounded-lg border border-dust/60 bg-white/60 px-2 py-1.5">
                <span className="text-xs font-medium text-charcoal">{campo.label}</span>
                <Select
                  className="h-8 w-40 text-xs"
                  value={mapeamento[campo.key] ?? ''}
                  onChange={(e) =>
                    setMapeamento((prev) => ({ ...prev, [campo.key]: e.target.value }))
                  }
                >
                  <option value="">— ignorar —</option>
                  {colunas.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onArquivo(f)
            e.target.value = ''
          }}
        />

        {colunas.length > 0 && (
          <DialogFooter>
            <Button variant="ghost" onClick={reset}>
              Trocar arquivo
            </Button>
            <Button onClick={importar} disabled={importando || !mapeamento.nomePerfil && !mapeamento.linkPerfil}>
              {importando ? 'Importando…' : `Importar ${linhas.length} leads`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
