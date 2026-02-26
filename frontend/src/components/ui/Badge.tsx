import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600 text-white hover:bg-blue-500/80",
        secondary:
          "border-transparent bg-gray-800 text-gray-100 hover:bg-gray-700/80",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-500/80",
        outline: "text-gray-400 border-gray-700",
        success: "border-transparent bg-green-900/40 text-green-400 hover:bg-green-900/60",
        warning: "border-transparent bg-orange-900/40 text-orange-400 hover:bg-orange-900/60",
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
