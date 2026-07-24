// Clarity — faux iOS status bar. The clock is real, because a frozen 9:41 is the
// first thing that makes a demo look like a demo.
import { useEffect, useState } from "react";
import { CellBars, Wifi } from "./icons";

function clock(): string {
  return new Date()
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(/\s?[AP]M/i, "");
}

export default function StatusBar() {
  const [time, setTime] = useState(clock);

  useEffect(() => {
    const id = window.setInterval(() => setTime(clock()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 top-0 z-[70] flex h-14 items-center justify-between px-8 text-foreground"
      aria-hidden="true"
    >
      <span className="readout text-[16px] font-semibold tracking-[0.01em]">{time}</span>
      <span className="flex items-center gap-[7px] opacity-90">
        <CellBars />
        <Wifi />
        <span className="inline-flex items-center">
          <span className="relative inline-block h-3 w-[23px] rounded-[3.5px] border-[1.5px] border-current opacity-50">
            <span className="absolute inset-[1.5px] w-[65%] rounded-[1.5px] bg-current opacity-100" />
          </span>
          <span className="ml-px inline-block h-1 w-[1.6px] rounded-r-[2px] bg-current opacity-50" />
        </span>
      </span>
    </div>
  );
}
