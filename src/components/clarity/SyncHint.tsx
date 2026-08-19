// Clarity — the "keep pulling to sync" footer.
//
// Sits at the very end of a scrollable page. It only becomes visible as the
// gesture is actually travelling, so a page you never over-scroll never shows
// an instruction you did not ask for.
import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";

export default function SyncHint({
  progress,
  syncing,
}: {
  progress: number;
  syncing: boolean;
}) {
  const armed = progress >= 1 || syncing;
  return (
    <div
      className="pointer-events-none flex h-12 items-center justify-center"
      aria-live="polite"
      aria-label={syncing ? "Syncing" : undefined}
    >
      <motion.div
        className="flex items-center gap-2"
        animate={{ opacity: progress > 0.06 ? 1 : 0, y: progress > 0.06 ? 0 : 6 }}
        transition={SPRING.crisp}
      >
        <motion.span
          className="block h-[6px] rounded-full"
          style={{ background: "var(--spice-grad)" }}
          animate={{ width: 18 + progress * 44, opacity: 0.5 + progress * 0.5 }}
          transition={SPRING.crisp}
        />
        <span className="text-[11.5px] font-semibold tracking-[0.08em] text-muted-foreground">
          {syncing ? "SYNCING…" : armed ? "RELEASE TO SYNC" : "KEEP PULLING TO SYNC"}
        </span>
      </motion.div>
    </div>
  );
}
