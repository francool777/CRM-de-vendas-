import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-paprika text-cream',
        secondary: 'border-transparent bg-dust/50 text-charcoal',
        amber: 'border-transparent bg-amber/25 text-charcoal',
        outline: 'border-dust text-charcoal',
        ink: 'border-transparent bg-ink text-cream',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
