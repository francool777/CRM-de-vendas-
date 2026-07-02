import { useEffect } from 'react'
import { useData } from '@/store/DataContext'
import { useToast } from '@/components/Toast'

// Ctrl+Z / Ctrl+Shift+Z (e as variantes com Cmd no Mac) para desfazer/refazer
// ações sobre leads. Não intercepta quando o foco está num campo de texto —
// nesse caso o Ctrl+Z deve desfazer a digitação, não uma ação do histórico.
export function useUndoRedoShortcuts() {
  const { undo, redo, canUndo, canRedo, undoLabel, redoLabel } = useData()
  const { showToast } = useToast()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const ctrlOuCmd = e.ctrlKey || e.metaKey
      if (!ctrlOuCmd || e.key.toLowerCase() !== 'z') return

      const alvo = document.activeElement
      const emCampoDeTexto =
        alvo instanceof HTMLElement &&
        (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)
      if (emCampoDeTexto) return

      e.preventDefault()
      if (e.shiftKey) {
        if (!canRedo) return
        const label = redoLabel
        redo().then(() => showToast({ title: 'Ação refeita', description: label ?? undefined, duration: 3000 }))
      } else {
        if (!canUndo) return
        const label = undoLabel
        undo().then(() => showToast({ title: 'Ação desfeita', description: label ?? undefined, duration: 3000 }))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, canUndo, canRedo, undoLabel, redoLabel, showToast])
}
