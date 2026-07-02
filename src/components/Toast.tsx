import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export interface ToastOptions {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
}

const ToastContext = createContext<{ showToast: (opts: ToastOptions) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (opts: ToastOptions) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { ...opts, id }])
      window.setTimeout(() => dismiss(id), opts.duration ?? 6000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="pointer-events-auto w-full rounded-xl border border-dust bg-ink px-4 py-3 text-cream shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-xs text-cream/75">{toast.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {toast.actionLabel && (
                    <Button
                      size="sm"
                      className="h-7 bg-paprika text-cream hover:bg-paprika/85"
                      onClick={() => {
                        toast.onAction?.()
                        dismiss(toast.id)
                      }}
                    >
                      {toast.actionLabel}
                    </Button>
                  )}
                  <button
                    onClick={() => dismiss(toast.id)}
                    className="text-cream/50 transition-colors hover:text-cream"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return ctx
}
