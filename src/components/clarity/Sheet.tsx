// Clarity — bottom sheet.
//
// Hand-rolled rather than Vaul, for one structural reason: the app lives inside
// a 440px device frame, and Vaul portals to `document.body`, so its sheet would
// slide up over the desk the phone is sitting on. This one is absolutely
// positioned inside the frame instead.
//
// The physics follow Vaul's own: the panel tracks the finger 1:1 downward,
// resists upward, and the release decision is made on *velocity first, then
// distance* — a fast flick dismisses even from near the top, which is what
// makes a sheet feel thrown rather than dragged.
import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { DUR, EASE_IN, SPRING, prefersReducedMotion } from "@/lib/motion";
import { IconAction } from "./Action";
import { X } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Sits under the title, in the header, and stays put while the body scrolls. */
  subtitle?: ReactNode;
  children: ReactNode;
  /** Pinned to the bottom edge, outside the scroll area. */
  footer?: ReactNode;
}

/** Past this far down, or this fast, the sheet closes on release. */
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 520;

export default function Sheet({ open, onClose, title, subtitle, children, footer }: Props) {
  // Escape closes it, matching every other dismissible surface in the app.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const reduced = prefersReducedMotion();

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > CLOSE_DISTANCE || info.velocity.y > CLOSE_VELOCITY) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="scrim"
            className="absolute inset-0 z-[60] bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: DUR.fast, ease: EASE_IN } }}
            transition={{ duration: DUR.base }}
            onClick={onClose}
            aria-label={`Close ${title}`}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 z-[61] flex max-h-[86%] flex-col overflow-hidden rounded-t-[26px] border-t border-sand-line bg-[hsl(var(--sietch))] shadow-[0_-24px_60px_-12px_rgba(0,0,0,.9)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: DUR.base, ease: EASE_IN } }}
            transition={reduced ? { duration: 0.01 } : SPRING.smooth}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            // Free downward, heavily resisted upward — the sheet is already at
            // its ceiling, and letting it stretch up would read as a bug.
            dragElastic={{ top: 0.02, bottom: 0.9 }}
            onDragEnd={onDragEnd}
          >
            {/* The grabber doubles as the drag affordance and the close button. */}
            <div className="flex-none cursor-grab pt-2.5 active:cursor-grabbing">
              <div className="mx-auto h-[5px] w-[38px] rounded-full bg-foreground/25" />
            </div>

            <div className="flex flex-none items-start gap-3 px-[22px] pb-3 pt-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[20px] font-extrabold tracking-[-0.02em]">{title}</h2>
                {subtitle && <div className="mt-1 text-[13px] text-muted-foreground">{subtitle}</div>}
              </div>
              <IconAction
                icon={<X size={16} />}
                label="Close"
                tooltip="Close this panel"
                onClick={onClose}
                side="left"
                hideLabel
              />
            </div>

            <div className="clarity-scroll min-h-0 flex-1 overflow-y-auto px-[22px] pb-5">{children}</div>

            {footer && (
              <div
                className="flex-none border-t border-sand-line bg-[hsl(var(--sietch))] px-[22px] pt-3.5"
                style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
