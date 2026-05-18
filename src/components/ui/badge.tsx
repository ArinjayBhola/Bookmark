import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-stone-300 px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-stone-800 text-stone-100 border-transparent hover:bg-stone-800/80",
        secondary:
          "bg-stone-200 text-stone-800 border-transparent hover:bg-stone-300/80",
        destructive:
          "bg-red-900 text-stone-100 border-transparent hover:bg-red-900/80",
        outline: "text-stone-800",
        terrain: "bg-[#e2dfd5] text-stone-800 border-[#d5d3c9]",
        status: "bg-[#d9d6cc] text-stone-900 border-[#ccc9be]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
