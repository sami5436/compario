"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};
const today = () => new Date().toDateString();

function issueNumber(d: Date) {
  const start = Date.UTC(2026, 0, 1);
  return Math.max(1, Math.floor((d.getTime() - start) / 86_400_000) + 1);
}

export function Masthead() {
  // The server prints no date, so a cached page never shows a stale one.
  const stamp = useSyncExternalStore(noop, today, () => null);
  const now = stamp ? new Date(stamp) : null;
  const date = now?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) ?? "\u00a0";
  return (
    <header className="pt-6">
      <div className="kicker flex items-end justify-between gap-4 border-b border-ink pb-1.5 text-ink-soft">
        <span>Vol. I, No. {now ? issueNumber(now) : "\u00a0"}</span>
        <span className="hidden sm:inline">{date}</span>
        <span>Not investment advice</span>
      </div>
      <div className="flex flex-col items-center py-4 sm:py-6">
        <h1 className="text-[clamp(3.2rem,11vw,7.5rem)] font-semibold leading-[0.85] tracking-[-0.035em]" style={{ fontVariationSettings: '"opsz" 72' }}>
          Compario
        </h1>
        <p className="mt-3 text-center text-[1.02rem] italic text-ink-soft sm:text-lg">
          The working trader&rsquo;s gazette of strategies, tested side by side on the same tape.
        </p>
      </div>
      <div className="rule-double" />
    </header>
  );
}
