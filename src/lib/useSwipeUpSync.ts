// Clarity — swipe past the bottom of a page to sync it.
//
// Pull-to-refresh, upside down. The gesture lives at the *end* of a page
// rather than the top because the top of every screen here is a collapsing
// header that already owns the downward drag — hanging a second meaning on it
// would make both worse.
//
// Deliberately gated on the container already being scrolled to its bottom, so
// the gesture cannot fire mid-page, and on an explicit distance threshold, so
// a flick that merely lands hard at the end does not count as a request.
import { useEffect, useRef, useState } from "react";

/** How far past the end you have to keep pulling before it counts. */
const THRESHOLD = 72;
/** Slack below the true bottom that still reads as "at the bottom". */
const BOTTOM_SLOP = 2;

export interface SwipeUpSyncState {
  /** 0–1: how much of the threshold has been travelled. Drives the indicator. */
  progress: number;
  /** True while the sync itself is running. */
  syncing: boolean;
}

export function useSwipeUpSync(
  ref: React.RefObject<HTMLElement>,
  onSync: () => void,
  enabled = true,
): SwipeUpSyncState {
  const [progress, setProgress] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Everything the gesture needs between events, kept off React state so a
  // drag does not re-render on every pixel.
  const pull = useRef(0);
  const startY = useRef<number | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const atBottom = () =>
      el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_SLOP;

    const reset = () => {
      pull.current = 0;
      startY.current = null;
      fired.current = false;
      setProgress(0);
    };

    const advance = (delta: number) => {
      if (fired.current) return;
      pull.current = Math.max(0, pull.current + delta);
      setProgress(Math.min(1, pull.current / THRESHOLD));
      if (pull.current >= THRESHOLD) {
        fired.current = true;
        setProgress(1);
        setSyncing(true);
        onSync();
        // Held briefly so the confirmation is legible rather than a flash.
        window.setTimeout(() => {
          setSyncing(false);
          reset();
        }, 620);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      startY.current = atBottom() ? e.touches[0].clientY : null;
      pull.current = 0;
      fired.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || !atBottom()) {
        startY.current = atBottom() ? e.touches[0].clientY : null;
        return;
      }
      // Swiping *up* drags content up: the finger's Y decreases.
      const travelled = startY.current - e.touches[0].clientY;
      if (travelled <= 0) {
        pull.current = 0;
        setProgress(0);
        return;
      }
      advance(travelled - pull.current);
    };

    // Trackpads and mice get the same gesture, so the app is testable and
    // usable on a desktop rather than being a phone-only behaviour.
    let wheelIdle = 0;
    const onWheel = (e: WheelEvent) => {
      if (!atBottom() || e.deltaY <= 0) return;
      advance(e.deltaY * 0.6);
      window.clearTimeout(wheelIdle);
      wheelIdle = window.setTimeout(reset, 260);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", reset, { passive: true });
    el.addEventListener("touchcancel", reset, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", reset);
      el.removeEventListener("touchcancel", reset);
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelIdle);
    };
  }, [ref, onSync, enabled]);

  return { progress, syncing };
}
