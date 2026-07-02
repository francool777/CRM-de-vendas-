import { useState } from 'react'
import { Check, Copy, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'
import type { Lead, PlaybookScript } from '@/lib/types'

interface Props {
  script: PlaybookScript
  leadSelecionado: Lead | null
}

// Renderização leve do markdown: preserva quebras de linha e destaca **negrito**
function renderConteudo(texto: string) {
  const escapado = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const comNegrito = escapado.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  return { __html: comNegrito }
}

async function copiarTexto(texto: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = texto
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

export function PlaybookScriptCard({ script, leadSelecionado }: Props) {
  const { updateScript, deleteScript } = useData()
  const { showToast } = useToast()

  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(script.titulo)
  const [conteudo, setConteudo] = useState(script.conteudo)
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    let texto = script.conteudo
    if (leadSelecionado) {
      // substitui [NOME] pelo nome do perfil do lead em contexto (sem o @)
      texto = texto.replace(/\[NOME\]/g, leadSelecionado.nomePerfil.replace(/^@/, ''))
    }
    await copiarTexto(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
    showToast({
      title: 'Script copiado!',
      description: leadSelecionado
        ? `[NOME] substituído por ${leadSelecionado.nomePerfil}`
        : 'Copiado com a variável [NOME] — selecione um lead para substituir automaticamente.',
      duration: 3500,
    })
  }

  async function salvar() {
    await updateScript(script.id, { titulo, conteudo })
    setEditando(false)
    showToast({ title: 'Script salvo' })
  }

  async function excluir() {
    if (!window.confirm(`Excluir o script "${script.titulo}"?`)) return
    await deleteScript(script.id)
  }

  return (
    <motion.div
      layout
      className="rounded-xl border border-dust/70 bg-cream p-4 shadow-card"
    >
      {editando ? (
        <div className="flex flex-col gap-3">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="font-semibold" />
          <Textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={10}
            className="font-body text-sm leading-relaxed"
          />
          <p className="text-[11px] text-charcoal/60">
            Use <code className="rounded bg-dust/40 px-1">[NOME]</code> onde o nome do lead deve
            entrar. Markdown simples (<strong>**negrito**</strong>) é suportado.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTitulo(script.titulo)
                setConteudo(script.conteudo)
                setEditando(false)
              }}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={salvar}>
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-serif-accent text-base font-semibold text-ink">{script.titulo}</h3>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="sm" onClick={copiar} title="Copiar script">
                {copiado ? (
                  <Check className="h-3.5 w-3.5 text-paprika" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copiar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditando(true)} title="Editar">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <button
                onClick={excluir}
                className="rounded p-1.5 text-charcoal/40 transition-colors hover:text-paprika"
                title="Excluir script"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div
            className="whitespace-pre-wrap text-sm leading-relaxed text-charcoal"
            dangerouslySetInnerHTML={renderConteudo(script.conteudo)}
          />
        </>
      )}
    </motion.div>
  )
}
