import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PlaybookScriptCard } from '@/components/PlaybookScriptCard'
import { useData } from '@/store/DataContext'

export function Playbook() {
  const { playbook, leads, addCategoria, deleteCategoria, addScript } = useData()
  const [searchParams, setSearchParams] = useSearchParams()

  const [novaCategoriaAberta, setNovaCategoriaAberta] = useState(false)
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('')
  const [novoScriptCategoria, setNovoScriptCategoria] = useState<number | null>(null)
  const [novoScriptTitulo, setNovoScriptTitulo] = useState('')

  const leadParam = searchParams.get('lead')
  const leadSelecionado = leadParam
    ? (leads.find((l) => l.id === Number(leadParam)) ?? null)
    : null

  async function criarCategoria() {
    const nome = novaCategoriaNome.trim()
    if (!nome) return
    await addCategoria(nome)
    setNovaCategoriaNome('')
    setNovaCategoriaAberta(false)
  }

  async function criarScript(categoriaId: number) {
    const titulo = novoScriptTitulo.trim() || 'Novo script'
    await addScript(categoriaId, titulo, 'Escreva o conteúdo aqui… Use [NOME] para o nome do lead.')
    setNovoScriptTitulo('')
    setNovoScriptCategoria(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl uppercase tracking-wide text-ink">Playbook</h1>
        <div className="flex items-center gap-2">
          {/* seletor de lead para substituição do [NOME] */}
          <Select
            className="w-56"
            value={leadParam ?? ''}
            onChange={(e) => {
              if (e.target.value) setSearchParams({ lead: e.target.value })
              else setSearchParams({})
            }}
          >
            <option value="">Copiar sem lead (mantém [NOME])</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nomePerfil}
              </option>
            ))}
          </Select>
          {novaCategoriaAberta ? (
            <span className="flex items-center gap-1">
              <Input
                autoFocus
                className="w-44"
                placeholder="Nome da categoria"
                value={novaCategoriaNome}
                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') criarCategoria()
                  if (e.key === 'Escape') setNovaCategoriaAberta(false)
                }}
              />
              <Button size="sm" onClick={criarCategoria}>
                OK
              </Button>
            </span>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setNovaCategoriaAberta(true)}>
              <Plus className="h-3.5 w-3.5" /> Nova categoria
            </Button>
          )}
        </div>
      </div>

      {leadSelecionado && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-paprika/40 bg-paprika/10 px-4 py-2 text-sm text-ink">
          Copiando scripts para{' '}
          <strong className="text-paprika">{leadSelecionado.nomePerfil}</strong> — a variável{' '}
          <code className="rounded bg-white/60 px-1 text-xs">[NOME]</code> será substituída
          automaticamente.
          <button
            onClick={() => setSearchParams({})}
            className="ml-auto rounded p-1 text-charcoal/60 hover:text-ink"
            title="Limpar lead selecionado"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Accordion
        type="multiple"
        // remonta quando as categorias carregam, para abrirem todas por padrão
        key={playbook.map((c) => c.id).join('-')}
        defaultValue={playbook.map((c) => String(c.id))}
        className="flex flex-col gap-3"
      >
        {playbook.map((cat) => (
          <AccordionItem key={cat.id} value={String(cat.id)}>
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                {cat.nome}
                <span className="rounded-full bg-dust/40 px-2 py-0.5 font-body text-xs normal-case tracking-normal text-charcoal">
                  {cat.scripts.length}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                {cat.scripts.map((script) => (
                  <PlaybookScriptCard
                    key={script.id}
                    script={script}
                    leadSelecionado={leadSelecionado}
                  />
                ))}

                {novoScriptCategoria === cat.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      placeholder='Título do script (ex: "Tá caro")'
                      value={novoScriptTitulo}
                      onChange={(e) => setNovoScriptTitulo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') criarScript(cat.id)
                        if (e.key === 'Escape') setNovoScriptCategoria(null)
                      }}
                    />
                    <Button size="sm" onClick={() => criarScript(cat.id)}>
                      Criar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setNovoScriptCategoria(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNovoScriptCategoria(cat.id)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Novo script
                    </Button>
                    {cat.criavelPeloUsuario && cat.scripts.length === 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir a categoria "${cat.nome}"?`))
                            deleteCategoria(cat.id)
                        }}
                        className="text-xs text-charcoal/50 underline-offset-2 hover:text-paprika hover:underline"
                      >
                        excluir categoria
                      </button>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
