import { cn } from "@/lib/utils"

// shadcn's Skeleton, tinted with the brand sand tokens so it follows the
// dashboard's light and dark themes.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse motion-reduce:animate-none rounded-md bg-sand-200/70", className)}
      {...props}
    />
  )
}

export { Skeleton }
