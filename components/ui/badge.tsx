import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--ds-brand-subtle)] text-[var(--ds-brand-primary)] hover:bg-[var(--ds-brand-subtle)]",
        secondary:
          "border-transparent bg-[var(--ds-surface-card-hover)] text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-card-active)]",
        destructive:
          "border-transparent bg-red-100 text-red-600 hover:bg-red-200",
        outline: "border-[var(--ds-border-primary)] text-[var(--ds-text-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
