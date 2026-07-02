import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Snowflake, Sun } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { TEMPERATURA_LABELS, TEMPERATURAS, type Temperatura } from '@/lib/types'

const ICONS: Record<Temperatura, { icon: typeof Flame; className: string; bg: string }> = {
  // Frio: tom de Dust Grey azulado leve
  FRIO: { icon: Snowflake, className: 'text-slate-400', bg: 'hover:bg-slate-100' },
  // Morno: Amber Flame
  MORNO: { icon: Sun, className: 'text-amber', bg: 'hover:bg-amber/15' },
  // Quente: Spicy Paprika
  QUENTE: { icon: Flame, className: 'text-paprika', bg: 'hover:bg-paprika/10' },
}

interface Props {
  value: Temperatura
  onChange: (t: Temperatura) => void
  size?: 'sm' | 'md'
}

export function TemperatureSelector({ value, onChange, size = 'md' }: Props) {
  const [open, setOpen] = useState(false)
  const current = ICONS[value]
  const CurrentIcon = current.icon
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title={`Temperatura: ${TEMPERATURA_LABELS[value]}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex items-center justify-center rounded-full p-1 transition-colors',
            current.bg,
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={value}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.18 }}
              className="flex"
            >
              <CurrentIcon className={cn(iconSize, current.className)} />
            </motion.span>
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {TEMPERATURAS.map((t) => {
            const { icon: Icon, className } = ICONS[t]
            return (
              <motion.button
                key={t}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                title={TEMPERATURA_LABELS[t]}
                onClick={() => {
                  onChange(t)
                  setOpen(false)
                }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  t === value ? 'bg-dust/50 ring-1 ring-dust' : 'hover:bg-dust/30',
                )}
              >
                <Icon className={cn('h-5 w-5', className)} />
              </motion.button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
