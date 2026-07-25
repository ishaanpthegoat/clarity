// Clarity — the motion system.
//
// One place for every duration, curve and spring in the app, following Emil
// Kowalski's rules from "Animations on the Web":
//
//   1. Animate transform and opacity. Nothing else hits the compositor.
//   2. Enters ease *out* (fast, then settle). Exits ease *in* and run shorter —
//      the user has already decided, don't make them wait to leave.
//   3. Duration scales with distance. A 4px nudge at 300ms feels broken.
//   4. Anything a finger can interrupt is a spring, not a curve.
//   5. Scrubbed / continuous motion is the only place `linear` belongs.
//   6. Reduced motion is a real preference, not an edge case.
//
// Screens import from here instead of hand-rolling numbers, so the whole app
// decelerates the same way.

import type { Transition } from "motion/react";

/** Emil's curve — the one behind Vaul and Sonner. Decisive out, long settle. */
export const EASE_OUT = [0.32, 0.72, 0, 1] as const;
/** Mirrored, for exits. */
export const EASE_IN = [0.7, 0, 0.84, 0] as const;
/** Symmetric, for things that move both ways (a value ticking up and down). */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** CSS-string forms, for the places that are still plain CSS. */
export const CSS_EASE_OUT = `cubic-bezier(${EASE_OUT.join(",")})`;
export const CSS_EASE_IN = `cubic-bezier(${EASE_IN.join(",")})`;

/**
 * Durations, in seconds. Named by how far the thing travels, not by where it
 * is used — a tooltip and a checkbox move the same distance, so they share.
 */
export const DUR = {
  /** State flips: a check, a colour, a chip. Barely a transition at all. */
  instant: 0.12,
  /** Small travel — a few px, an icon swap, a tooltip. */
  fast: 0.18,
  /** The default. Cards settling in, sheets tracking a finger. */
  base: 0.28,
  /** Long travel — a full-screen push, a drawer from the bottom edge. */
  slow: 0.42,
  /** Cinematic. Onboarding scenes only; never blocks an interaction. */
  scene: 0.7,
} as const;

/** Enters: ease-out, full duration. */
export const enter = (duration: number = DUR.base): Transition => ({
  duration,
  ease: EASE_OUT,
});

/** Exits: ease-in, and deliberately quicker than the matching enter. */
export const exit = (duration: number = DUR.fast): Transition => ({
  duration,
  ease: EASE_IN,
});

/**
 * Springs. Reach for these whenever a gesture can interrupt the animation
 * mid-flight — a duration-based curve fights the finger, a spring rides it.
 */
export const SPRING = {
  /** Snappy, almost no overshoot. Toggles, chips, tab indicators. */
  crisp: { type: "spring", stiffness: 520, damping: 38, mass: 0.7 },
  /** The default spring. Cards, sheets, anything hand-sized. */
  smooth: { type: "spring", stiffness: 320, damping: 34, mass: 0.9 },
  /** Soft landing with a little life in it. Celebration, score reveals. */
  bouncy: { type: "spring", stiffness: 260, damping: 18, mass: 0.9 },
  /** Heavy and slow — used to smooth scroll-linked values, not to move UI. */
  scrub: { type: "spring", stiffness: 90, damping: 28, mass: 0.6 },
} satisfies Record<string, Transition>;

/**
 * Stagger for a list appearing at once. Capped on purpose: past ~6 items the
 * last card arrives late enough that the screen reads as slow, so everything
 * after the cap lands together.
 */
export const stagger = (index: number, step = 0.035, cap = 6): number =>
  Math.min(index, cap) * step;

/** Cards rising into place. The app's single entrance animation. */
export const riseIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

/** Something appearing where you tapped — scales from its own origin. */
export const popIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
} as const;

/** A screen replacing another screen. */
export const screenIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
} as const;

/**
 * True when the user has asked the system for less motion.
 *
 * Read this at call time rather than caching it — the preference can change
 * while the app is open, and a stale `false` is the failure mode that matters.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Collapses a transition to a near-instant cross-fade when reduced motion is
 * on. Position still changes, it just stops travelling to get there.
 */
export function respectMotion(transition: Transition): Transition {
  return prefersReducedMotion() ? { duration: 0.01 } : transition;
}
