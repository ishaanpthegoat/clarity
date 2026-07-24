// Clarity — faux iOS status bar (time + signal / wifi / battery)
import { CellBars, Wifi } from "./icons";

export default function StatusBar() {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-[70] flex h-14 items-center justify-between px-8">
      <span className="text-[16px] font-bold tracking-[0.3px]">9:41</span>
      <span className="flex items-center gap-[7px]">
        <CellBars />
        <Wifi />
        <span className="inline-flex items-center">
          <span className="relative inline-block h-3 w-[23px] rounded-[3.5px] border-[1.5px] border-white/50">
            <span className="absolute inset-[1.5px] w-[65%] rounded-[1.5px] bg-white" />
          </span>
          <span className="ml-px inline-block h-1 w-[1.6px] rounded-r-[2px] bg-white/50" />
        </span>
      </span>
    </div>
  );
}
