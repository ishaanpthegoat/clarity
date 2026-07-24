// Clarity — shared inline SVG icons (ported from the design)
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 24): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
});

export const ChevronLeft = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const ChevronRight = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Gear = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
export const Lock = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.5" /></svg>
);
export const Check = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const ArrowUpRight = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Clock = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
export const Camera = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="2" /><path d="M9 7l1.5-2.5h3L15 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
);
export const HomeIcon = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
);
export const GridIcon = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" /><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" /><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" /><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" /></svg>
);
export const ListIcon = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M3 6l1.2 1.2L6.5 4.8M3 12l1.2 1.2L6.5 10.8M3 18l1.2 1.2L6.5 16.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const MoonIcon = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
);
export const CameraLens = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="13.5" r="3.4" stroke="currentColor" strokeWidth="1.8" /><path d="M9 7l1.5-2.5h3L15 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
);

export const Plus = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
);
export const X = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
);
export const Flame = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 3s5 4.2 5 8.6a5 5 0 0 1-10 0C7 9.4 9 8 9 8s.4 2 1.6 2C11.8 10 12 7 12 3z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /><path d="M12 21a4 4 0 0 0 4-4c0-2-2-3-4-5-2 2-4 3-4 5a4 4 0 0 0 4 4z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>
);
export const ChartIcon = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
export const Trophy = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M7 4h10v5a5 5 0 0 1-10 0V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
export const Sound = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 9v6h4l5 4V5L8 9H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
export const SoundOff = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 9v6h4l5 4V5L8 9H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M17 9.5l4 5M21 9.5l-4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
export const Shield = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 3l8 3v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Sun = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
export const Search = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
export const Trash = ({ size = 24, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// iOS status-bar glyphs
export const CellBars = (p: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="12" viewBox="0 0 18 12" {...p}><rect x="0" y="7" width="3" height="5" rx="1" fill="#fff" /><rect x="5" y="4.5" width="3" height="7.5" rx="1" fill="#fff" /><rect x="10" y="2" width="3" height="10" rx="1" fill="#fff" /><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff" /></svg>
);
export const Wifi = (p: SVGProps<SVGSVGElement>) => (
  <svg width="17" height="12" viewBox="0 0 17 12" {...p}><path d="M8.5 2.4c2.6 0 5 1 6.8 2.7l1.3-1.4C14.4 1.5 11.6.3 8.5.3S2.6 1.5.4 3.7l1.3 1.4C3.5 3.4 5.9 2.4 8.5 2.4z" fill="#fff" /><path d="M8.5 6c1.5 0 2.9.6 3.9 1.6l1.3-1.4C12.3 4.8 10.5 4 8.5 4s-3.8.8-5.2 2.2l1.3 1.4C5.6 6.6 7 6 8.5 6z" fill="#fff" /><circle cx="8.5" cy="10" r="1.7" fill="#fff" /></svg>
);
