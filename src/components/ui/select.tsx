import * as React from 'react'
import { cn } from '@/lib/utils'

// Select nativo estilizado — suficiente para filtros e edição inline
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full cursor-pointer appearance-none rounded-lg border border-dust bg-white/60 px-3 py-1 pr-8 text-sm text-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paprika/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23403D39' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.6rem center',
      }}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

export { Select }
