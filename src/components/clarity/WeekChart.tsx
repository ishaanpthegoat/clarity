// Clarity — weekly deep-work bar chart (7 days, today highlighted)
const BARS = [
  { h: 38, day: "M" },
  { h: 62, day: "T" },
  { h: 48, day: "W" },
  { h: 80, day: "T" },
  { h: 70, day: "F" },
  { h: 88, day: "S", active: true },
  { h: 20, day: "S", empty: true },
];

export default function WeekChart() {
  return (
    <>
      <div className="flex h-[72px] items-end justify-between gap-2">
        {BARS.map((b, i) => (
          <span
            key={i}
            className="flex-1 rounded-[6px]"
            style={{
              height: b.h + "%",
              background: b.active
                ? "linear-gradient(#c4b2ff,#7a4bff)"
                : b.empty
                ? "rgba(255,255,255,.06)"
                : "rgba(139,107,255,.22)",
              boxShadow: b.active ? "0 0 18px rgba(139,107,255,.5)" : undefined,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2">
        {BARS.map((b, i) => (
          <span
            key={i}
            className="flex-1 text-center text-[10px]"
            style={{ color: b.active ? "#a98cff" : "#55555f", fontWeight: b.active ? 700 : 400 }}
          >
            {b.day}
          </span>
        ))}
      </div>
    </>
  );
}
