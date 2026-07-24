// Clarity — the last seven days of real focus time.
import { useClarity } from "@/lib/clarityStore";
import { dateKey, dayInitial, formatDuration, getDay, lastSevenDays } from "@/lib/clarityStats";

export default function WeekChart() {
  const { state } = useClarity();
  const keys = lastSevenDays();
  const today = dateKey();

  const bars = keys.map((k) => ({
    key: k,
    seconds: getDay(state.days, k).focusedSeconds,
    initial: dayInitial(k),
    isToday: k === today,
  }));

  // Scale against the week's best day, floored at the goal so a strong day
  // never makes an ordinary one look like nothing.
  const peak = Math.max(state.goalMinutes * 60 * 0.5, ...bars.map((b) => b.seconds), 1);

  return (
    <>
      <div className="flex h-[72px] items-end justify-between gap-2">
        {bars.map((b) => {
          const pct = Math.round((b.seconds / peak) * 100);
          return (
            <span
              key={b.key}
              className="flex-1 rounded-[6px] transition-[height] duration-500"
              title={`${formatDuration(b.seconds)} on ${b.key}`}
              style={{
                height: `${b.seconds ? Math.max(6, Math.min(100, pct)) : 5}%`,
                background: b.isToday
                  ? "var(--spice-grad)"
                  : b.seconds
                    ? "hsl(var(--spice-400) / 0.3)"
                    : "hsl(var(--sand-line))",
                boxShadow: b.isToday && b.seconds ? "0 0 16px hsl(var(--spice-400) / 0.45)" : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-2">
        {bars.map((b) => (
          <span
            key={b.key}
            className="flex-1 text-center text-[10px]"
            style={{
              color: b.isToday ? "hsl(var(--spice-300))" : "hsl(var(--muted-foreground))",
              fontWeight: b.isToday ? 700 : 400,
            }}
          >
            {b.initial}
          </span>
        ))}
      </div>
    </>
  );
}
