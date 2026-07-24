// Clarity — lightweight haptic + toast feedback helpers
import { toast } from "sonner";

export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* unsupported */
  }
}

export function cheer(message: string, description?: string) {
  haptic([10, 40, 10]);
  toast.success(message, { description });
}

export function note(message: string, description?: string) {
  haptic(10);
  toast(message, { description });
}
