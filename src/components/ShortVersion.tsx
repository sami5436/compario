"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { catalog, catalogById } from "@/engine/catalog";
import type { StrategyId } from "@/engine/types";
import { longDate, money } from "@/lib/format";
import { yearsAgo } from "@/lib/periods";
import { defaultSettings, toQuery } from "@/lib/settings";
import { useBacktest } from "@/lib/useBacktest";
import { Masthead } from "./Masthead";
import { TickerSearch } from "./TickerSearch";

const START = 10_000;
const ALL = catalog.map((c) => c.id);

/** One sentence a newcomer can follow, no option jargon. */
const PLAIN: Record<StrategyId, string> = {
  hold: "Buy it and leave it alone.",
  coveredCall: "Own it, and sell someone your gains above a set price for cash up front.",
  cashPut: "Keep cash, and get paid to promise to buy if the price drops.",
  wheel: "Get paid to buy it cheaper, then get paid to sell it higher, on repeat.",
  putSpread: "Get paid to cover small drops, with a hard cap on how much you can lose.",
  collar: "Own it with a safety net below and a ceiling above.",
  marriedPut: "Own it and pay for crash insurance every month.",
  dca: "Buy a slice each month for a year instead of all at once.",
  trend: "Own it while it is rising, sit in cash while it is falling.",
  levered: "A fund that moves twice as much as the stock every day.",
  cash: "Leave it in Treasury bills earning interest.",
};

const PERIODS: { label: string; from: () => string }[] = [
  { label: "1 year", from: () => yearsAgo(1) },
  { label: "3 years", from: () => yearsAgo(3) },
  { label: "5 years", from: () => yearsAgo(5) },
  { label: "Since 2015", from: () => "2015-01-02" },
  { label: "20 years", from: () => yearsAgo(20) },
];

function signedMoney(x: number) {
  if (Math.abs(x) < 0.5) return "$0";
  return `${x > 0 ? "+" : "−"}${money(Math.abs(x), false)}`;
}

export function ShortVersion() {
  const [symbol, setSymbol] = useState("SPY");
  const [period, setPeriod] = useState("Since 2015");
  const [from, setFrom] = useState("2015-01-02");

  const settings = useMemo(() => ({ ...defaultSettings(), symbol, from, to: "", capital: START, strategies: ALL }), [symbol, from]);
  const { status, output, history, error } = useBacktest(settings);
  const ready = status === "ready" && output;

  const rows = useMemo(() => (output ? [...output.results].sort((a, b) => b.metrics.finalValue - a.metrics.finalValue) : []), [output]);
  const hold = rows.find((r) => r.id === "hold");
  const best = rows[0];
  const calmest = [...rows].filter((r) => r.id !== "cash").sort((a, b) => b.metrics.maxDrawdown - a.metrics.maxDrawdown)[0];
  const beatHold = hold ? rows.filter((r) => r.id !== "hold" && r.metrics.finalValue > hold.metrics.finalValue).length : 0;
  const top = best?.metrics.finalValue ?? 1;
  const name = history?.symbol ?? symbol;
  const startDate = output?.dates?.[0];
  const deskLink = `/?${toQuery(settings)}`;

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-6">
      <Masthead />

      <article className="mx-auto mt-6 max-w-[860px]">
        <p className="kicker text-accent">The short version</p>
        <h1 className="mt-2 text-[clamp(2rem,6vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.02em]" style={{ fontVariationSettings: '"opsz" 60' }}>
          If you put $10,000 into {name}
          {startDate ? ` on ${longDate(startDate)}` : ""}&hellip;
        </h1>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end [&>*]:min-w-0">
          <TickerSearch value={symbol} onSubmit={setSymbol} label="Try another ticker" />
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] md:pb-[34px]">
            {PERIODS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPeriod(p.label);
                  setFrom(p.from());
                }}
                className={`shrink-0 border px-2.5 py-1 text-[0.85rem] ${period === p.label ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {status === "error" && (
          <div className="mt-6 border-l-4 border-loss bg-paper-deep px-4 py-3">
            <p className="font-semibold">{error}</p>
            <p className="text-[0.9rem] italic text-ink-soft">Double check the ticker, or try one of the popular ones above.</p>
          </div>
        )}

        {status !== "error" && (
          <div className={`transition-opacity ${ready ? "" : "opacity-50"}`}>
            {hold && best && (
              <section className="mt-8 grid gap-px border-2 border-ink bg-ink sm:grid-cols-3">
                <div className="bg-paper p-4">
                  <p className="kicker text-ink-faint">Just holding it</p>
                  <p className="figures mt-1 text-[2rem] font-semibold leading-none">{money(hold.metrics.finalValue, false)}</p>
                  <p className="mt-1 text-[0.9rem] text-ink-soft">
                    {hold.metrics.finalValue >= START ? "grew" : "shrank"} by {money(Math.abs(hold.metrics.finalValue - START), false)}
                  </p>
                </div>
                <div className="bg-paper p-4">
                  <p className="kicker text-ink-faint">Most money</p>
                  <p className="figures mt-1 text-[2rem] font-semibold leading-none" style={{ color: `var(--s-${best.id})` }}>
                    {money(best.metrics.finalValue, false)}
                  </p>
                  <p className="mt-1 text-[0.9rem] text-ink-soft">{catalogById[best.id].name}</p>
                </div>
                <div className="bg-paper p-4">
                  <p className="kicker text-ink-faint">Beat just holding</p>
                  <p className="figures mt-1 text-[2rem] font-semibold leading-none">
                    {beatHold} <span className="text-[1rem] font-normal text-ink-faint">of {rows.length - 1}</span>
                  </p>
                  <p className="mt-1 text-[0.9rem] text-ink-soft">other approaches ended with more</p>
                </div>
              </section>
            )}

            {calmest && hold && (
              <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-soft">
                Holding meant watching the account fall <strong className="text-ink">{Math.round(-hold.metrics.maxDrawdown * 100)}%</strong> at its worst. The
                smoothest ride was <strong className="text-ink">{catalogById[calmest.id].name.toLowerCase()}</strong>, whose biggest drop was{" "}
                <strong className="text-ink">{Math.round(-calmest.metrics.maxDrawdown * 100)}%</strong>.
              </p>
            )}

            <section className="mt-8">
              <div className="flex items-end justify-between border-b-2 border-ink pb-1">
                <h2 className="kicker">Where your $10,000 ended up</h2>
                <span className="kicker text-ink-faint">{ready ? "Most to least" : "Crunching"}</span>
              </div>
              <ol>
                {(rows.length ? rows : []).map((r, i) => {
                  const diff = hold ? r.metrics.finalValue - hold.metrics.finalValue : 0;
                  return (
                    <li key={r.id} className="border-b border-rule py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[1.08rem] font-semibold leading-tight">
                            <span className="figures mr-2 text-[0.8rem] font-normal text-ink-faint">{i + 1}</span>
                            {catalogById[r.id].name}
                          </p>
                          <p className="mt-0.5 text-[0.9rem] leading-snug text-ink-soft">{PLAIN[r.id]}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="figures text-[1.25rem] font-semibold leading-tight">{money(r.metrics.finalValue, false)}</p>
                          {r.id === "hold" ? (
                            <p className="text-[0.78rem] italic text-ink-faint">the benchmark</p>
                          ) : (
                            <p className={`figures text-[0.8rem] ${diff >= 0 ? "text-gain" : "text-loss"}`}>{signedMoney(diff)} vs holding</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-2 flex-1 bg-paper-deep">
                          <div className="h-full" style={{ width: `${Math.max(1, (r.metrics.finalValue / top) * 100)}%`, background: `var(--s-${r.id})` }} />
                        </div>
                        <span className="figures shrink-0 whitespace-nowrap text-right text-[0.75rem] text-ink-faint">
                          worst drop {Math.round(-r.metrics.maxDrawdown * 100)}%
                        </span>
                      </div>
                    </li>
                  );
                })}
                {!rows.length &&
                  Array.from({ length: 6 }, (_, i) => (
                    <li key={i} className="border-b border-rule py-3">
                      <div className="h-5 w-1/2 animate-pulse bg-paper-deep" />
                      <div className="mt-2 h-2 w-full animate-pulse bg-paper-deep" />
                    </li>
                  ))}
              </ol>
            </section>
          </div>
        )}

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link href={deskLink} className="block border-2 border-ink p-4 hover:bg-ink hover:text-paper">
            <p className="kicker">Want the charts?</p>
            <p className="mt-1 text-lg font-semibold leading-snug">Open this exact run on the desk, with every setting you can change.</p>
          </Link>
          <Link href="/guide" className="block border-2 border-ink p-4 hover:bg-ink hover:text-paper">
            <p className="kicker">What are these?</p>
            <p className="mt-1 text-lg font-semibold leading-snug">Read how each strategy works and when it tends to win or lose.</p>
          </Link>
        </section>

        <p className="mt-6 text-[0.82rem] italic leading-relaxed text-ink-faint">
          Uses real daily prices with dividends included and the desk&rsquo;s standard settings: options about a month out, normal trading costs, and idle cash
          earning 4% a year. Option prices are estimated, not historical quotes. For education, not investment advice.
        </p>
      </article>
    </div>
  );
}
