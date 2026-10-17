"use client";

import { catalog } from "@/engine/catalog";
import type { StrategyId } from "@/engine/types";

interface Props {
  selected: StrategyId[];
  onChange: (ids: StrategyId[]) => void;
  focus: string | null;
  onFocus: (id: string | null) => void;
}

export function Roster({ selected, onChange, focus, onFocus }: Props) {
  const toggle = (id: StrategyId) => {
    if (id === "hold") return;
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    onChange(catalog.map((c) => c.id).filter((x) => next.includes(x)));
  };
  return (
    <div>
      <div className="flex flex-wrap gap-x-1 gap-y-1.5">
        {catalog.map((s) => {
          const on = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              title={s.summary}
              onClick={() => toggle(s.id)}
              onPointerEnter={() => on && onFocus(s.id)}
              onPointerLeave={() => onFocus(null)}
              disabled={s.id === "hold"}
              className={`group flex items-center gap-1.5 border px-2 py-1 text-[0.85rem] transition-colors ${
                on ? "border-ink" : "border-dashed border-rule text-ink-faint hover:border-ink-faint"
              } ${focus === s.id ? "bg-paper-deep" : ""} disabled:cursor-default`}
            >
              <span className="inline-block h-2 w-2 rotate-45" style={{ background: on ? `var(--s-${s.id})` : "transparent", border: `1px solid var(--s-${s.id})` }} />
              {s.name}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-4 text-[0.78rem] italic text-ink-soft">
        <button type="button" className="underline underline-offset-4 hover:text-accent" onClick={() => onChange(catalog.map((c) => c.id))}>
          Show all eleven
        </button>
        <button type="button" className="underline underline-offset-4 hover:text-accent" onClick={() => onChange(["hold", "coveredCall", "cashPut", "wheel"])}>
          Just the premium sellers
        </button>
      </div>
    </div>
  );
}
