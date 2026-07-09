export const STATUSES = [
  'LEAD',
  'INTERESSADO',
  'EM_NEGOCIACAO',
  'REUNIAO_AGENDADA',
  'NAO_RESPONDEU',
  'FECHADO',
  'DESCARTADO',
] as const

export type Status = (typeof STATUSES)[number]

export const STATUS_LABELS: Record<Status, string> = {
  LEAD: 'Lead',
  INTERESSADO: 'Interessado',
  EM_NEGOCIACAO: 'Em negociação',
  REUNIAO_AGENDADA: 'Reunião agendada',
  NAO_RESPONDEU: 'Não respondeu',
  FECHADO: 'Fechado',
  DESCARTADO: 'Descartado',
}

// Ordem das colunas do Kanban
export const KANBAN_ORDER: Status[] = [
  'LEAD',
  'INTERESSADO',
  'EM_NEGOCIACAO',
  'REUNIAO_AGENDADA',
  'FECHADO',
  'DESCARTADO',
  'NAO_RESPONDEU',
]

export const TEMPERATURAS = ['FRIO', 'MORNO', 'QUENTE'] as const
export type Temperatura = (typeof TEMPERATURAS)[number]

export const TEMPERATURA_LABELS: Record<Temperatura, string> = {
  FRIO: 'Frio',
  MORNO: 'Morno',
  QUENTE: 'Quente',
}

export const TIPOS_INTERACAO = [
  { value: 'MENSAGEM_ENVIADA', label: 'Mensagem enviada' },
  { value: 'RESPOSTA_RECEBIDA', label: 'Resposta recebida' },
  { value: 'REUNIAO', label: 'Reunião' },
  { value: 'NOTA', label: 'Nota' },
] as const

export interface Interacao {
  id: number
  leadId: number
  data: string
  tipo: string
  descricao: string | null
}

export interface Lead {
  id: number
  nomePerfil: string
  linkPerfil: string
  whatsapp: string | null
  plataformaContato: string
  segmentoNicho: string | null
  dataPrimeiroContato: string | null
  followup1Data: string | null
  followup1Confirmado: boolean
  followup2Data: string | null
  followup2Confirmado: boolean
  status: Status
  dataReuniao: string | null
  propostaEnviada: boolean
  valorProposta: number | null
  temperatura: Temperatura
  observacoes: string | null
  criadoEm: string
  atualizadoEm: string
  interacoes?: Interacao[]
}

export interface Opcao {
  id: number
  nome: string
}

export interface PlaybookScript {
  id: number
  categoriaId: number
  titulo: string
  conteudo: string
  ordem: number
  criadoEm: string
  atualizadoEm: string
}

export interface PlaybookCategoria {
  id: number
  nome: string
  ordem: number
  criavelPeloUsuario: boolean
  scripts: PlaybookScript[]
}
