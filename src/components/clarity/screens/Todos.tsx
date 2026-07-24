// Clarity — the day's list. Checking things here moves the Tasks ring.
import { useClarity } from "@/lib/clarityStore";
import { Check, Plus, Trash } from "../icons";

export default function Todos() {
  const { state, actions } = useClarity();
  const left = state.todos.filter((t) => !t.done).length;
  const done = state.todos.length - left;

  return (
    <div className="anim-fadeIn absolute inset-0 flex flex-col bg-background px-[22px] pb-[112px] pt-[78px]">
      <h1 className="font-display text-[34px] font-semibold uppercase tracking-[0.03em]">To-do</h1>
      <div className="mt-1.5 text-[14.5px] text-muted-foreground">
        {state.todos.length === 0 ? "Nothing on the list yet" : `${left} to go · ${done} done`}
      </div>

      <div className="clarity-scroll mt-[22px] flex flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {state.todos.length === 0 && (
          <div className="sietch-card flex flex-col items-center px-6 py-10 text-center">
            <div className="text-[16px] font-bold">An empty list is a good start</div>
            <div className="mt-2 max-w-[240px] text-[13.5px] leading-[1.5] text-muted-foreground">
              Add the two or three things that would make today count. Not fifteen.
            </div>
          </div>
        )}

        {state.todos.map((t) => (
          <div key={t.id} className="sietch-card group flex items-center gap-3.5 p-4">
            {/* 26px box, 44px tap target */}
            <button
              onClick={() => actions.toggleTodo(t.id)}
              className="-my-2 -ml-2 grid h-11 w-11 flex-none place-items-center"
              role="checkbox"
              aria-checked={t.done}
              aria-label={t.text}
            >
              <span
                className="grid h-[26px] w-[26px] place-items-center rounded-lg transition-colors"
                style={{
                  border: `2px solid ${t.done ? "hsl(var(--spice-400))" : "hsl(var(--sand-line))"}`,
                  background: t.done ? "hsl(var(--spice-400))" : "transparent",
                  color: t.done ? "hsl(var(--primary-foreground))" : "transparent",
                }}
              >
                {t.done && <Check size={14} />}
              </span>
            </button>
            <span
              className="min-w-0 flex-1 break-words text-[16px] font-medium transition-colors"
              style={{
                color: t.done ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                textDecoration: t.done ? "line-through" : "none",
              }}
            >
              {t.text}
            </span>
            <button
              onClick={() => actions.removeTodo(t.id)}
              className="-my-2 -mr-2 grid h-11 w-11 flex-none place-items-center text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`Remove ${t.text}`}
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <input
          value={state.todoDraft}
          onChange={(e) => actions.setTodoDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && actions.addTodo()}
          placeholder="Add a task"
          aria-label="Add a task"
          name="todo"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={120}
          className="flex-1 rounded-[14px] border border-sand-line raise p-[15px] text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
        />
        <button
          onClick={actions.addTodo}
          disabled={!state.todoDraft.trim()}
          className="spice-grad grid w-[52px] place-items-center rounded-[14px] text-[hsl(var(--primary-foreground))] transition-opacity disabled:opacity-40"
          aria-label="Add task"
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  );
}
