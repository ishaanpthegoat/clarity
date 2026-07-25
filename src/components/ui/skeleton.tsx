import { cn } from "@/lib/utils";

/**
 * A placeholder for content that is still on its way.
 *
 * Sweeps warm light left-to-right rather than pulsing opacity: a sweep reads as
 * "loading, in reading order", a pulse reads as "broken and blinking". It moves
 * `background-position` only, and stops dead under `prefers-reduced-motion`
 * (see the `.skeleton-sweep` rule in index.css).
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton-sweep rounded-[10px]", className)} {...props} />;
}

/**
 * A block of fake text. The last line is short, the way a real paragraph ends —
 * without it the block reads as a grey box instead of as words.
 */
function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-[11px]"
          style={{
            width: i === lines - 1 ? "62%" : `${92 - (i % 3) * 6}%`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText };
