import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock @capacitor/preferences before importing store
const mockPreferencesStore = new Map<string, string>();
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({
      value: mockPreferencesStore.get(key) ?? null,
    })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      mockPreferencesStore.set(key, value);
    }),
  },
}));

import { getState, setState, initStore } from "@/lib/store";

const STORAGE_KEY = "mindlock_state";

describe("store persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPreferencesStore.clear();
  });

  it("returns default state when both storages are empty", () => {
    const state = getState();
    expect(state.onboardingComplete).toBe(false);
    expect(state.streak).toBe(0);
    expect(state.name).toBe("");
  });

  it("setState writes to localStorage", () => {
    setState({ name: "Alice", streak: 5 });
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.name).toBe("Alice");
    expect(parsed.streak).toBe(5);
  });

  it("getState reads from localStorage", () => {
    setState({ name: "Bob", onboardingComplete: true });
    const state = getState();
    expect(state.name).toBe("Bob");
    expect(state.onboardingComplete).toBe(true);
  });

  it("initStore restores from Preferences when localStorage is empty", async () => {
    // Simulate native backup existing but localStorage cleared
    const backup = JSON.stringify({
      name: "Charlie",
      streak: 12,
      onboardingComplete: true,
    });
    mockPreferencesStore.set(STORAGE_KEY, backup);

    // localStorage is empty
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    await initStore();

    // Should have restored to localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const state = getState();
    expect(state.name).toBe("Charlie");
    expect(state.streak).toBe(12);
    expect(state.onboardingComplete).toBe(true);
  });

  it("initStore syncs localStorage to Preferences when localStorage exists", async () => {
    // localStorage has data, Preferences is empty
    setState({ name: "Dana", streak: 3 });
    mockPreferencesStore.clear();

    await initStore();

    // Preferences should now have the data
    const backup = mockPreferencesStore.get(STORAGE_KEY);
    expect(backup).toBeTruthy();
    const parsed = JSON.parse(backup!);
    expect(parsed.name).toBe("Dana");
    expect(parsed.streak).toBe(3);
  });
});
