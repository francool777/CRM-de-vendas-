import { differenceInCalendarDays, isPast, startOfDay } from 'date-fns'
import type { Lead } from './types'

// Extrai o @usuario de uma URL de perfil (Instagram e similares)
export function extractHandle(raw: string): string {
  const input = raw.trim()
  if (!input) return ''
  if (input.startsWith('@')) return input

  try {
    const url = new URL(input.match(/^https?:\/\//) ? input : `https://${input}`)
    const segments = url.pathname.split('/').filter(Boolean)
    const naoSaoPerfil = ['p', 'reel', 'reels', 'explore', 'tv', 'accounts']
    if (segments[0] === 'stories' && segments[1]) return `@${segments[1]}`
    if (segments[0] && !naoSaoPerfil.includes(segments[0])) {
      return `@${decodeURIComponent(segments[0]).replace(/^@/, '')}`
    }
  } catch {
    // não é URL — tenta tratar como handle puro
  }

  const match = input.match(/@?([A-Za-z0-9._]{2,})/)
  return match ? `@${match[1]}` : input
}

// Data do último contato: interação mais recente > 1º contato > criação
export function lastContactDate(lead: Lead): Date {
  const datas: number[] = []
  if (lead.interacoes?.length) {
    datas.push(...lead.interacoes.map((i) => new Date(i.data).getTime()))
  }
  if (lead.dataPrimeiroContato) datas.push(new Date(lead.dataPrimeiroContato).getTime())
  if (datas.length === 0) return new Date(lead.criadoEm)
  return new Date(Math.max(...datas))
}

export function daysSinceLastContact(lead: Lead): number {
  return differenceInCalendarDays(new Date(), lastContactDate(lead))
}

// Follow-up vencido: data passada e status ainda LEAD / NAO_RESPONDEU
export function isFollowupOverdue(lead: Lead): boolean {
  if (lead.status !== 'LEAD' && lead.status !== 'NAO_RESPONDEU') return false
  const vencida = (d: string | null) => !!d && isPast(startOfDay(new Date(d))) && !isToday(d)
  return vencida(lead.followup1Data) || vencida(lead.followup2Data)
}

function isToday(d: string): boolean {
  return differenceInCalendarDays(new Date(), new Date(d)) === 0
}

// Qual follow-up está vencido (para exibição nas listas)
export function overdueFollowupDate(lead: Lead): Date | null {
  if (!isFollowupOverdue(lead)) return null
  const candidatos = [lead.followup1Data, lead.followup2Data]
    .filter((d): d is string => !!d)
    .map((d) => new Date(d))
    .filter((d) => differenceInCalendarDays(new Date(), d) > 0)
    .sort((a, b) => a.getTime() - b.getTime())
  return candidatos[0] ?? null
}

export function formatBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
