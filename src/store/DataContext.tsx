import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Interacao, Lead, Opcao, PlaybookCategoria, PlaybookScript } from '@/lib/types'

function porCriacaoDesc(a: Lead, b: Lead): number {
  return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
}

interface HistoryEntry {
  label: string
  undo: () => Promise<unknown>
  redo: () => Promise<unknown>
}

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
  bulkUpdateLeads: (ids: number[], patch: Partial<Lead>) => Promise<Lead[]>
  deleteLead: (id: number) => Promise<void>
  deleteLeads: (ids: number[]) => Promise<number>
  importLeads: (rows: Record<string, unknown>[]) => Promise<number>
  addSegmento: (nome: string) => Promise<Opcao>
  removeSegmento: (id: number) => Promise<void>
  addPlataforma: (nome: string) => Promise<Opcao>
  removePlataforma: (id: number) => Promise<void>
  addInteracao: (leadId: number, tipo: string, descricao?: string) => Promise<void>
  addCategoria: (nome: string) => Promise<void>
  deleteCategoria: (id: number) => Promise<void>
  addScript: (categoriaId: number, titulo: string, conteudo: string) => Promise<void>
  updateScript: (id: number, patch: { titulo?: string; conteudo?: string }) => Promise<void>
  deleteScript: (id: number) => Promise<void>
  // desfazer / refazer (leads)
  canUndo: boolean
  canRedo: boolean
  undoLabel: string | null
  redoLabel: string | null
  undo: () => Promise<void>
  redo: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [segmentos, setSegmentos] = useState<Opcao[]>([])
  const [plataformas, setPlataformas] = useState<Opcao[]>([])
  const [playbook, setPlaybook] = useState<PlaybookCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // pilha de desfazer/refazer — vive só na memória desta sessão (reinicia ao
  // fechar o app), igual à maioria dos editores desktop
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([])
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([])

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

  function pushHistory(entry: HistoryEntry) {
    setUndoStack((prev) => [...prev, entry])
    setRedoStack([])
  }

  async function undo() {
    if (undoStack.length === 0) return
    const entry = undoStack[undoStack.length - 1]
    setUndoStack((prev) => prev.slice(0, -1))
    await entry.undo()
    setRedoStack((prev) => [...prev, entry])
  }

  async function redo() {
    if (redoStack.length === 0) return
    const entry = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    await entry.redo()
    setUndoStack((prev) => [...prev, entry])
  }

  // ---- operações "cruas": só sincronizam estado + API, sem tocar no histórico.
  // Usadas tanto pelas funções públicas quanto pelos próprios undo()/redo(),
  // para uma ação desfeita não virar uma nova entrada no histórico.

  async function applyCreateLead(input: Parameters<DataContextValue['createLead']>[0]): Promise<Lead> {
    const lead = await api.post<Lead>('/api/leads', input)
    setLeads((prev) => [lead, ...prev].sort(porCriacaoDesc))
    return lead
  }

  async function applyUpdateLead(id: number, patch: Partial<Lead>): Promise<Lead> {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    const lead = await api.patch<Lead>(`/api/leads/${id}`, patch)
    setLeads((prev) => prev.map((l) => (l.id === id ? lead : l)))
    return lead
  }

  async function applyBulkUpdate(ids: number[], patch: Partial<Lead>): Promise<Lead[]> {
    if (ids.length === 0) return []
    setLeads((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, ...patch } : l)))
    const atualizados = await api.patch<Lead[]>('/api/leads', { ids, patch })
    setLeads((prev) => prev.map((l) => atualizados.find((a) => a.id === l.id) ?? l))
    return atualizados
  }

  async function applyDeleteLead(id: number): Promise<void> {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    await api.delete(`/api/leads/${id}`)
  }

  async function applyDeleteLeads(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0
    setLeads((prev) => prev.filter((l) => !ids.includes(l.id)))
    const { deleted } = await api.delete<{ deleted: number }>('/api/leads', { ids })
    return deleted
  }

  async function applyRestoreLeads(snapshots: Lead[]): Promise<Lead[]> {
    if (snapshots.length === 0) return []
    const restaurados = await api.post<Lead[]>('/api/leads/restore', { leads: snapshots })
    setLeads((prev) => {
      const idsRestaurados = new Set(restaurados.map((l) => l.id))
      return [...restaurados, ...prev.filter((l) => !idsRestaurados.has(l.id))].sort(porCriacaoDesc)
    })
    return restaurados
  }

  // ---- API pública (usada pela UI) — cada uma registra sua reversão no histórico

  const createLead: DataContextValue['createLead'] = async (input) => {
    const lead = await applyCreateLead(input)
    pushHistory({
      label: `criação de ${lead.nomePerfil}`,
      undo: () => applyDeleteLead(lead.id),
      redo: () => applyRestoreLeads([lead]),
    })
    return lead
  }

  const updateLead: DataContextValue['updateLead'] = async (id, patch) => {
    const atual = leads.find((l) => l.id === id)
    const patchAntes: Partial<Lead> = {}
    if (atual) {
      for (const k of Object.keys(patch) as (keyof Lead)[]) {
        ;(patchAntes as Record<string, unknown>)[k] = atual[k]
      }
    }
    const lead = await applyUpdateLead(id, patch)
    pushHistory({
      label: `edição de ${lead.nomePerfil}`,
      undo: () => applyUpdateLead(id, patchAntes),
      redo: () => applyUpdateLead(id, patch),
    })
    return lead
  }

  const bulkUpdateLeads: DataContextValue['bulkUpdateLeads'] = async (ids, patch) => {
    const alvos = leads.filter((l) => ids.includes(l.id))
    if (alvos.length === 0) return []
    const patchesAntes = alvos.map((l) => {
      const antes: Partial<Lead> = {}
      for (const k of Object.keys(patch) as (keyof Lead)[]) {
        ;(antes as Record<string, unknown>)[k] = l[k]
      }
      return { id: l.id, antes }
    })
    const atualizados = await applyBulkUpdate(ids, patch)
    pushHistory({
      label: `edição em lote de ${alvos.length} lead${alvos.length === 1 ? '' : 's'}`,
      undo: async () => {
        for (const { id, antes } of patchesAntes) await applyUpdateLead(id, antes)
      },
      redo: () => applyBulkUpdate(ids, patch),
    })
    return atualizados
  }

  const deleteLead: DataContextValue['deleteLead'] = async (id) => {
    const atual = leads.find((l) => l.id === id)
    if (!atual) return
    await applyDeleteLead(id)
    pushHistory({
      label: `exclusão de ${atual.nomePerfil}`,
      undo: () => applyRestoreLeads([atual]),
      redo: () => applyDeleteLead(id),
    })
  }

  const deleteLeads: DataContextValue['deleteLeads'] = async (ids) => {
    const alvos = leads.filter((l) => ids.includes(l.id))
    if (alvos.length === 0) return 0
    const deleted = await applyDeleteLeads(ids)
    pushHistory({
      label: `exclusão de ${alvos.length} lead${alvos.length === 1 ? '' : 's'}`,
      undo: () => applyRestoreLeads(alvos),
      redo: () => applyDeleteLeads(ids),
    })
    return deleted
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

  const removeSegmento: DataContextValue['removeSegmento'] = async (id) => {
    setSegmentos((prev) => prev.filter((s) => s.id !== id))
    await api.delete(`/api/segmentos/${id}`)
  }

  const addPlataforma: DataContextValue['addPlataforma'] = async (nome) => {
    const plat = await api.post<Opcao>('/api/plataformas', { nome })
    setPlataformas((prev) =>
      prev.some((p) => p.id === plat.id) ? prev : [...prev, plat].sort((a, b) => a.nome.localeCompare(b.nome)),
    )
    return plat
  }

  const removePlataforma: DataContextValue['removePlataforma'] = async (id) => {
    setPlataformas((prev) => prev.filter((p) => p.id !== id))
    await api.delete(`/api/plataformas/${id}`)
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
        bulkUpdateLeads,
        deleteLead,
        deleteLeads,
        importLeads,
        addSegmento,
        removeSegmento,
        addPlataforma,
        removePlataforma,
        addInteracao,
        addCategoria,
        deleteCategoria,
        addScript,
        updateScript,
        deleteScript,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undoLabel: undoStack.length > 0 ? undoStack[undoStack.length - 1].label : null,
        redoLabel: redoStack.length > 0 ? redoStack[redoStack.length - 1].label : null,
        undo,
        redo,
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
