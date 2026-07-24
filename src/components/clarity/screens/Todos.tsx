// Clarity — To-do list. Checkable items + add.
import { useClarity } from "@/lib/clarityStore";

export default function Todos() {
  const { state, actions } = useClarity();
  const left = state.todos.filter((t) => !t.done).length;
  const done = state.todos.length - left;

  return (
    <div className="anim-fadeIn absolute inset-0 flex flex-col bg-black px-[22px] pb-[112px] pt-[78px]">
      <div className="text-[30px] font-extrabold tracking-[-0.8px]">To-do</div>
      <div className="mt-2 text-[15px] text-[#8a8a97]">
        {left} to go · {done} done
      </div>

      <div className="clarity-scroll mt-[22px] flex flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {state.todos.map((t) => (
          <div key={t.id} className="flex items-center gap-3.5 rounded-[16px] border border-[rgba(140,110,255,.1)] bg-[#0e0d13] p-4">
            <button
              onClick={() => actions.toggleTodo(t.id)}
              className="grid h-[26px] w-[26px] flex-none place-items-center rounded-lg text-[14px] text-white"
              style={{
                border: "2px solid " + (t.done ? "#9d7bff" : "rgba(255,255,255,.22)"),
                background: t.done ? "#8b6bff" : "transparent",
              }}
            >
              {t.done ? "✓" : ""}
            </button>
            <span
              className="flex-1 text-[16px] font-medium"
              style={{ color: t.done ? "#55555f" : "#fff", textDecoration: t.done ? "line-through" : "none" }}
            >
              {t.text}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <input
          value={state.todoDraft}
          onChange={(e) => actions.setTodoDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && actions.addTodo()}
          placeholder="Add a task"
          className="flex-1 rounded-[14px] border border-[rgba(140,110,255,.18)] bg-[#0e0d13] p-[15px] text-[15px] text-white outline-none placeholder:text-[#55555f]"
        />
        <button
          onClick={actions.addTodo}
          className="w-[52px] rounded-[14px] text-[26px] text-white"
          style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
