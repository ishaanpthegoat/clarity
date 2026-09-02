// Clarity — the duration slider bounds.
//
// These were declared in `clarityStore.tsx` and still are, re-exported from
// there so nothing that already imports them has to change. They live in their
// own module because `onboarding.ts` needs them and importing the store — a
// React module with a provider in it — from a pure parsing helper drags a
// component graph into every test that touches it.
export const SESSION_BOUNDS = { min: 5, max: 420, step: 5 } as const;
export const GOAL_BOUNDS = { min: 10, max: 720, step: 10 } as const;
