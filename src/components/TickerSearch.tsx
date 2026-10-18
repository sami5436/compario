"use client";

import { useState } from "react";
import { POPULAR_TICKERS } from "@/lib/periods";

interface Props {
  value: string;
  onSubmit: (symbol: string) => void;
  /** Visible label above the box. */
  label?: string;
}

/** A ticker box with a submit button and one tap picks, sized for thumbs. */
export function TickerSearch({ value, onSubmit, label = "Look up any ticker" }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const submit = () => {
    const v = (draft ?? value).trim().toUpperCase();
    setDraft(null);
    if (v) onSubmit(v);
  };
  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="kicker text-ink-faint" htmlFor="ticker-search">
          {label}
        </label>
        <div className="mt-1 flex items-stretch border-2 border-ink bg-paper">
          <input
            id="ticker-search"
            type="search"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            maxLength={15}
            placeholder="SPY, AAPL, TSLA..."
            className="figures min-w-0 flex-1 bg-transparent px-3 py-2.5 text-2xl font-medium uppercase tracking-wide outline-none placeholder:text-base placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-faint focus:bg-highlight"
            value={draft ?? value}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="kicker shrink-0 border-l-2 border-ink bg-ink px-4 text-paper active:opacity-80">
            Go
          </button>
        </div>
      </form>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {POPULAR_TICKERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setDraft(null);
              onSubmit(t);
            }}
            className={`figures shrink-0 border px-2.5 py-1 text-[0.8rem] ${t === value ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft"}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
