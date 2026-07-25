import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/**
 * Themed range slider.
 *
 * The thumb is 26px — well past the 24px floor for a dragged control — and it
 * scales up while held so the finger covering it still gets feedback. Colour
 * transitions are explicit properties; `transform` is left alone so the grab
 * scale never fights the drag.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center py-2.5",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-[7px] w-full grow overflow-hidden rounded-full border border-sand-line bg-[hsl(var(--muted))]">
      <SliderPrimitive.Range
        className="absolute h-full rounded-full"
        style={{ background: "var(--spice-grad)" }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-[26px] w-[26px] rounded-full border-[3px] border-[hsl(var(--spice-300))] bg-[hsl(var(--void))] shadow-[0_4px_14px_-2px_rgba(240,144,43,.6)] transition-[box-shadow,border-color,scale] duration-150 hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] active:scale-[1.14] disabled:pointer-events-none disabled:opacity-50"
      aria-label="Drag to change"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
