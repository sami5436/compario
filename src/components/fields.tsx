"use client";

import { useId, useState, type ReactNode } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  /** Displayed value is the stored value times this, e.g. 100 for percents. */
  scale?: number;
  suffix?: string;
  prefix?: string;
  hint?: string;
  digits?: number;
}

export function NumberField({ label, value, onChange, min, max, step, scale = 1, suffix, prefix, hint, digits }: NumberFieldProps) {
  const id = useId();
  const shown = value * scale;
  const places = digits ?? (step * scale < 1 ? Math.min(3, String(step * scale).split(".")[1]?.length ?? 1) : 0);
  // Holds raw keystrokes only while the box is being edited.
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (raw: string) => {
    setDraft(null);
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return;
    onChange(Math.min(max, Math.max(min, n / scale)));
  };

  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.92rem] leading-tight">
          {label}
        </label>
        <span className="figures flex items-baseline text-[0.82rem]">
          {prefix && <span className="text-ink-faint">{prefix}</span>}
          <input
            aria-label={`${label} value`}
            className="bg-transparent text-right outline-none focus:bg-highlight"
            style={{ width: `${Math.max(4, (draft ?? shown.toFixed(places)).length + 0.5)}ch` }}
            inputMode="decimal"
            value={draft ?? shown.toFixed(places)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
          />
          {suffix && <span className="ml-0.5 text-ink-faint">{suffix}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min * scale}
        max={max * scale}
        step={step * scale}
        value={shown}
        onChange={(e) => onChange(Number(e.target.value) / scale)}
      />
      {hint && <p className="text-[0.78rem] italic leading-snug text-ink-faint">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-2">
      <span>
        <span className="block text-[0.92rem] leading-tight">{label}</span>
        {hint && <span className="block text-[0.78rem] italic leading-snug text-ink-faint">{hint}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="figures mt-0.5 shrink-0 border border-ink px-1.5 text-[0.7rem] leading-5 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-accent"
      >
        {checked ? "YES" : "NO "}
      </span>
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid border border-ink" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`kicker px-1 py-2 transition-colors ${i > 0 ? "border-l border-ink" : ""} ${
            o.value === value ? "bg-ink text-paper" : "hover:bg-paper-deep"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Section({ numeral, title, children, open = true }: { numeral: string; title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-rule py-3 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-baseline gap-2 [&::-webkit-details-marker]:hidden">
        <span className="figures text-[0.72rem] text-accent">{numeral}</span>
        <span className="kicker flex-1">{title}</span>
        <span className="figures text-[0.8rem] text-ink-faint transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}
