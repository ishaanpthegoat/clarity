// Clarity — ⌘K palette.
// Every screen and every action the app can take, one keystroke away. It also
// doubles as the app's own map: if a thing is not in here, it is not reachable.
import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useClarity, type ClarityView } from "@/lib/clarityStore";

interface Row {
  label: string;
  hint?: string;
  shortcut?: string;
  run: () => void;
  keywords?: string;
}

export default function CommandPalette() {
  const { state, actions } = useClarity();
  const open = state.paletteOpen;
  const setOpen = actions.setPaletteOpen;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const go = (v: ClarityView) => () => {
    actions.go(v);
    setOpen(false);
  };
  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  const navigate: Row[] = [
    { label: "Home", shortcut: "H", run: go("home") },
    { label: "Insights", hint: "Your real numbers", run: go("insights"), keywords: "stats history chart" },
    { label: "Milestones", hint: "What you've earned", run: go("milestones"), keywords: "achievements badges" },
    { label: "Projects", run: go("projects") },
    { label: "To-do", run: go("todos") },
    { label: "Daily read", run: run(actions.openArticles), keywords: "article reading" },
    { label: "Evening check-in", run: go("checkin"), keywords: "mood reflection" },
    { label: "Home screen", hint: "See your locked apps", run: go("spring"), keywords: "springboard" },
    { label: "Settings", shortcut: ",", run: go("settings") },
  ];

  const doNow: Row[] = [
    {
      label: `Start a ${state.sessionMinutes}-minute focus session`,
      shortcut: "F",
      run: run(() => actions.startFocus()),
      keywords: "timer pomodoro deep work",
    },
    {
      label: "Start a Commit Mode session",
      hint: "No pause, no early exit",
      run: run(() => actions.startFocus({ strict: true })),
      keywords: "strict hard lock",
    },
    { label: "Change today's focus", run: run(actions.openTask), keywords: "task one thing" },
    {
      label: state.locking ? "Turn locking off" : "Turn locking on",
      shortcut: "L",
      run: run(actions.toggleLock),
      keywords: "block apps",
    },
    {
      label: state.theme === "dark" ? "Switch to light" : "Switch to dark",
      run: run(() => actions.setTheme(state.theme === "dark" ? "light" : "dark")),
      keywords: "theme appearance",
    },
    { label: "Export your history", run: run(actions.exportData), keywords: "download json backup" },
  ];

  const renderRow = (r: Row) => (
    <CommandItem key={r.label} value={`${r.label} ${r.keywords ?? ""}`} onSelect={r.run}>
      <span className="flex-1">
        <span className="block text-[14px] font-medium text-foreground">{r.label}</span>
        {r.hint && <span className="block text-[12px] text-muted-foreground">{r.hint}</span>}
      </span>
      {r.shortcut && <CommandShortcut>{r.shortcut}</CommandShortcut>}
    </CommandItem>
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search Clarity…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        <CommandGroup heading="Do now">{doNow.map(renderRow)}</CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">{navigate.map(renderRow)}</CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
