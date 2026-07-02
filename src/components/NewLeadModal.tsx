import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { extractHandle } from '@/lib/leadUtils'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// valor especial da opção "+ nova plataforma" no select
const NOVA_PLATAFORMA = '__nova_plataforma__'

export function NewLeadModal({ open, onOpenChange }: Props) {
  const { segmentos, plataformas, createLead, addSegmento, addPlataforma } = useData()
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
              <label className="mb-1 block text-xs font-medium text-charcoal">Plataforma</label>
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
                <button
                  key={s.id}
                  onClick={() => setSegmento(segmento === s.nome ? null : s.nome)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    segmento === s.nome
                      ? 'border-paprika bg-paprika text-cream'
                      : 'border-dust bg-white/60 text-charcoal hover:border-charcoal/40',
                  )}
                >
                  {s.nome}
                </button>
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
