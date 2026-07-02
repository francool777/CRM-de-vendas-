import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Interacao, Lead, Opcao, PlaybookCategoria, PlaybookScript } from '@/lib/types'

interface DataContextValue {
  leads: Lead[]
  segmentos: Opcao[]
  plataformas: Opcao[]
  playbook: PlaybookCategoria[]
  loading: boolean
  erro: string | null
  refresh: () => Promise<void>
  createLead: (input: {
    linkPerfil: string
    nomePerfil: string
    segmentoNicho?: string | null
    plataformaContato?: string
  }) => Promise<Lead>
  updateLead: (id: number, patch: Partial<Lead>) => Promise<Lead>
  deleteLead: (id: number) => Promise<void>
  importLeads: (rows: Record<string, unknown>[]) => Promise<number>
  addSegmento: (nome: string) => Promise<Opcao>
  addPlataforma: (nome: string) => Promise<Opcao>
  addInteracao: (leadId: number, tipo: string, descricao?: string) => Promise<void>
  addCategoria: (nome: string) => Promise<void>
  deleteCategoria: (id: number) => Promise<void>
  addScript: (categoriaId: number, titulo: string, conteudo: string) => Promise<void>
  updateScript: (id: number, patch: { titulo?: string; conteudo?: string }) => Promise<void>
  deleteScript: (id: number) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [segmentos, setSegmentos] = useState<Opcao[]>([])
  const [plataformas, setPlataformas] = useState<Opcao[]>([])
  const [playbook, setPlaybook] = useState<PlaybookCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [ls, segs, plats, pb] = await Promise.all([
        api.get<Lead[]>('/api/leads'),
        api.get<Opcao[]>('/api/segmentos'),
        api.get<Opcao[]>('/api/plataformas'),
        api.get<PlaybookCategoria[]>('/api/playbook'),
      ])
      setLeads(ls)
      setSegmentos(segs)
      setPlataformas(plats)
      setPlaybook(pb)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createLead: DataContextValue['createLead'] = async (input) => {
    const lead = await api.post<Lead>('/api/leads', input)
    setLeads((prev) => [lead, ...prev])
    return lead
  }

  const updateLead: DataContextValue['updateLead'] = async (id, patch) => {
    // otimista: aplica local imediatamente, servidor confirma em seguida
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    const lead = await api.patch<Lead>(`/api/leads/${id}`, patch)
    setLeads((prev) => prev.map((l) => (l.id === id ? lead : l)))
    return lead
  }

  const deleteLead: DataContextValue['deleteLead'] = async (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    await api.delete(`/api/leads/${id}`)
  }

  const importLeads: DataContextValue['importLeads'] = async (rows) => {
    const { imported } = await api.post<{ imported: number }>('/api/leads/import', { rows })
    await refresh()
    return imported
  }

  const addSegmento: DataContextValue['addSegmento'] = async (nome) => {
    const seg = await api.post<Opcao>('/api/segmentos', { nome })
    setSegmentos((prev) =>
      prev.some((s) => s.id === seg.id) ? prev : [...prev, seg].sort((a, b) => a.nome.localeCompare(b.nome)),
    )
    return seg
  }

  const addPlataforma: DataContextValue['addPlataforma'] = async (nome) => {
    const plat = await api.post<Opcao>('/api/plataformas', { nome })
    setPlataformas((prev) =>
      prev.some((p) => p.id === plat.id) ? prev : [...prev, plat].sort((a, b) => a.nome.localeCompare(b.nome)),
    )
    return plat
  }

  const addInteracao: DataContextValue['addInteracao'] = async (leadId, tipo, descricao) => {
    const interacao = await api.post<Interacao>(`/api/leads/${leadId}/interacoes`, {
      tipo,
      descricao,
    })
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, interacoes: [interacao, ...(l.interacoes ?? [])] } : l,
      ),
    )
  }

  const addCategoria: DataContextValue['addCategoria'] = async (nome) => {
    const cat = await api.post<PlaybookCategoria>('/api/playbook/categorias', { nome })
    setPlaybook((prev) => [...prev, cat])
  }

  const deleteCategoria: DataContextValue['deleteCategoria'] = async (id) => {
    setPlaybook((prev) => prev.filter((c) => c.id !== id))
    await api.delete(`/api/playbook/categorias/${id}`)
  }

  const addScript: DataContextValue['addScript'] = async (categoriaId, titulo, conteudo) => {
    const script = await api.post<PlaybookScript>('/api/playbook/scripts', {
      categoriaId,
      titulo,
      conteudo,
    })
    setPlaybook((prev) =>
      prev.map((c) => (c.id === categoriaId ? { ...c, scripts: [...c.scripts, script] } : c)),
    )
  }

  const updateScript: DataContextValue['updateScript'] = async (id, patch) => {
    const script = await api.patch<PlaybookScript>(`/api/playbook/scripts/${id}`, patch)
    setPlaybook((prev) =>
      prev.map((c) => ({
        ...c,
        scripts: c.scripts.map((s) => (s.id === id ? script : s)),
      })),
    )
  }

  const deleteScript: DataContextValue['deleteScript'] = async (id) => {
    setPlaybook((prev) => prev.map((c) => ({ ...c, scripts: c.scripts.filter((s) => s.id !== id) })))
    await api.delete(`/api/playbook/scripts/${id}`)
  }

  return (
    <DataContext.Provider
      value={{
        leads,
        segmentos,
        plataformas,
        playbook,
        loading,
        erro,
        refresh,
        createLead,
        updateLead,
        deleteLead,
        importLeads,
        addSegmento,
        addPlataforma,
        addInteracao,
        addCategoria,
        deleteCategoria,
        addScript,
        updateScript,
        deleteScript,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>')
  return ctx
}
