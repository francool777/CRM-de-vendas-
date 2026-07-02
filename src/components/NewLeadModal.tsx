import { useEffect, useState } from 'react'
import { Plus, Settings2, X } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { extractHandle } from '@/lib/leadUtils'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'
import type { Opcao } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// valor especial da opção "+ nova plataforma" no select
const NOVA_PLATAFORMA = '__nova_plataforma__'

export function NewLeadModal({ open, onOpenChange }: Props) {
  const { segmentos, plataformas, createLead, addSegmento, removeSegmento, addPlataforma, removePlataforma } =
    useData()
  const { showToast } = useToast()

  const [link, setLink] = useState('')
  const [nomePerfil, setNomePerfil] = useState('')
  const [nomeEditadoManualmente, setNomeEditadoManualmente] = useState(false)
  const [plataforma, setPlataforma] = useState('')
  const [novaPlataformaAberta, setNovaPlataformaAberta] = useState(false)
  const [novaPlataformaNome, setNovaPlataformaNome] = useState('')
  const [segmento, setSegmento] = useState<string | null>(null)
  const [novoSegmentoAberto, setNovoSegmentoAberto] = useState(false)
  const [novoSegmentoNome, setNovoSegmentoNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  // sempre que abrir, seleciona a primeira plataforma disponível por padrão
  useEffect(() => {
    if (open && !plataforma && plataformas.length > 0) {
      setPlataforma(plataformas[0].nome)
    }
  }, [open, plataformas, plataforma])

  useEffect(() => {
    if (!open) {
      setLink('')
      setNomePerfil('')
      setNomeEditadoManualmente(false)
      setPlataforma(plataformas[0]?.nome ?? '')
      setNovaPlataformaAberta(false)
      setNovaPlataformaNome('')
      setSegmento(null)
      setNovoSegmentoAberto(false)
      setNovoSegmentoNome('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // extrai o @usuario automaticamente ao colar o link
  function handleLinkChange(valor: string) {
    setLink(valor)
    if (!nomeEditadoManualmente) setNomePerfil(extractHandle(valor))
  }

  async function criarNovaPlataforma() {
    const nome = novaPlataformaNome.trim()
    if (!nome) return
    const criada = await addPlataforma(nome)
    setPlataforma(criada.nome)
    setNovaPlataformaAberta(false)
    setNovaPlataformaNome('')
  }

  async function criarNovoSegmento() {
    const nome = novoSegmentoNome.trim().toUpperCase()
    if (!nome) return
    await addSegmento(nome)
    setSegmento(nome)
    setNovoSegmentoAberto(false)
    setNovoSegmentoNome('')
  }

  async function removerSegmento(s: Opcao) {
    if (!window.confirm(`Remover "${s.nome}" da lista de segmentos? Isso não afeta leads que já usam esse valor, só some da lista de sugestões.`))
      return
    if (segmento === s.nome) setSegmento(null)
    await removeSegmento(s.id)
  }

  async function removerPlataforma(p: Opcao) {
    if (!window.confirm(`Remover "${p.nome}" da lista de plataformas? Isso não afeta leads que já usam esse valor, só some da lista de sugestões.`))
      return
    if (plataforma === p.nome) setPlataforma(plataformas.find((x) => x.id !== p.id)?.nome ?? '')
    await removePlataforma(p.id)
  }

  async function salvar() {
    if (!link.trim() || !nomePerfil.trim()) return
    setSalvando(true)
    try {
      await createLead({
        linkPerfil: link.trim(),
        nomePerfil: nomePerfil.trim(),
        segmentoNicho: segmento,
        plataformaContato: plataforma,
      })
      showToast({ title: `Lead ${nomePerfil.trim()} criado!`, description: 'Status inicial: Lead' })
      onOpenChange(false)
    } catch (e) {
      showToast({ title: 'Erro ao criar lead', description: String(e) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Cole o link do perfil — o resto é preenchido automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">Link do perfil</label>
            <Input
              autoFocus
              placeholder="https://instagram.com/nomedoperfil"
              value={link}
              onChange={(e) => handleLinkChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && salvar()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal">
                Nome do perfil
              </label>
              <Input
                placeholder="@perfil"
                value={nomePerfil}
                onChange={(e) => {
                  setNomePerfil(e.target.value)
                  setNomeEditadoManualmente(true)
                }}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-charcoal">Plataforma</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      title="Gerenciar plataformas cadastradas"
                      className="flex items-center gap-1 text-[11px] text-charcoal/60 hover:text-paprika"
                    >
                      <Settings2 className="h-3 w-3" /> gerenciar
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <p className="mb-2 px-1 text-xs font-medium text-charcoal">
                      Plataformas cadastradas
                    </p>
                    <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
                      {plataformas.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-dust/30"
                        >
                          <span className="truncate text-sm text-ink">{p.nome}</span>
                          <button
                            onClick={() => removerPlataforma(p)}
                            className="shrink-0 rounded p-0.5 text-charcoal/40 hover:text-paprika"
                            title="Remover"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {plataformas.length === 0 && (
                        <p className="px-2 py-1 text-xs text-charcoal/50">Nenhuma plataforma cadastrada.</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {novaPlataformaAberta ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    className="h-9 text-sm"
                    placeholder="Nova plataforma"
                    value={novaPlataformaNome}
                    onChange={(e) => setNovaPlataformaNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') criarNovaPlataforma()
                      if (e.key === 'Escape') setNovaPlataformaAberta(false)
                    }}
                  />
                  <Button size="sm" className="h-9 shrink-0" onClick={criarNovaPlataforma}>
                    OK
                  </Button>
                </div>
              ) : (
                <Select
                  value={plataforma}
                  onChange={(e) => {
                    if (e.target.value === NOVA_PLATAFORMA) {
                      setNovaPlataformaAberta(true)
                    } else {
                      setPlataforma(e.target.value)
                    }
                  }}
                >
                  {plataformas.map((p) => (
                    <option key={p.id} value={p.nome}>
                      {p.nome}
                    </option>
                  ))}
                  <option value={NOVA_PLATAFORMA}>+ nova plataforma…</option>
                </Select>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">
              Segmento / nicho
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {segmentos.map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    'flex items-center gap-1 rounded-full border pl-3 pr-1.5 py-1 text-xs font-medium transition-colors',
                    segmento === s.nome
                      ? 'border-paprika bg-paprika text-cream'
                      : 'border-dust bg-white/60 text-charcoal hover:border-charcoal/40',
                  )}
                >
                  <button onClick={() => setSegmento(segmento === s.nome ? null : s.nome)}>
                    {s.nome}
                  </button>
                  <button
                    onClick={() => removerSegmento(s)}
                    title="Remover opção"
                    className={cn(
                      'rounded-full p-0.5 transition-colors',
                      segmento === s.nome
                        ? 'text-cream/70 hover:bg-cream/20 hover:text-cream'
                        : 'text-charcoal/40 hover:bg-dust/50 hover:text-paprika',
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {novoSegmentoAberto ? (
                <span className="flex items-center gap-1">
                  <Input
                    autoFocus
                    className="h-7 w-36 text-xs"
                    placeholder="NOVO SEGMENTO"
                    value={novoSegmentoNome}
                    onChange={(e) => setNovoSegmentoNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') criarNovoSegmento()
                      if (e.key === 'Escape') setNovoSegmentoAberto(false)
                    }}
                  />
                  <Button size="sm" className="h-7" onClick={criarNovoSegmento}>
                    OK
                  </Button>
                </span>
              ) : (
                <button
                  onClick={() => setNovoSegmentoAberto(true)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-charcoal/40 px-3 py-1 text-xs font-medium text-charcoal transition-colors hover:border-paprika hover:text-paprika"
                >
                  <Plus className="h-3 w-3" /> novo segmento
                </button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || !link.trim() || !nomePerfil.trim()}>
            {salvando ? 'Salvando…' : 'Salvar lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
