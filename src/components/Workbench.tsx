"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { catalog, catalogById } from "@/engine/catalog";
import type { RunOutput } from "@/engine/run";
import { longDate, money, pct, signedPct } from "@/lib/format";
import { ERAS } from "@/lib/periods";
import { defaultSettings, fromQuery, toQuery, type Settings } from "@/lib/settings";
import { tellStory } from "@/lib/story";
import { useBacktest, type Status } from "@/lib/useBacktest";
import { Desk } from "./Desk";
import { Distribution } from "./Distribution";
import { Masthead } from "./Masthead";
import { TickerSearch } from "./TickerSearch";
import { Methodology } from "./Methodology";
import { Roster } from "./Roster";
import { Standings } from "./Standings";
import { TimeChart, type Series } from "./TimeChart";
import { Yearly } from "./Yearly";

const STATUS_COPY: Record<Status, string> = {
  idle: "Warming the presses",
  loading: "Fetching the tape",
  running: "Setting type",
  ready: "Late edition",
  error: "Stop the presses",
};

function SectionHead({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-t-2 border-ink pt-2">
      <div>
        <p className="kicker text-accent">{kicker}</p>
        <h3 className="text-2xl font-semibold leading-tight tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function pointLabel(out: RunOutput, i: number) {
  return out.dates ? longDate(out.dates[i]) : `Year ${(out.index[i] / 252).toFixed(1)}`;
}

export function Workbench() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // The address bar only exists in the browser, so shared settings load after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.search) setSettings(fromQuery(window.location.search));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      const q = toQuery(settings);
      window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
    }, 300);
    return () => window.clearTimeout(t);
  }, [settings, hydrated]);

  const set = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const { status, output, history, error } = useBacktest(settings);

  const out = output;
  const subject = settings.mode === "simulated" ? "synthetic" : (history?.symbol ?? settings.symbol);
  const story = useMemo(() => (out ? tellStory(out, subject) : null), [out, subject]);
  const multi = (out?.paths ?? 1) > 1;

  const equitySeries: Series[] = useMemo(
    () =>
      out?.results.map((r) => ({
        id: r.id,
        label: catalogById[r.id].short,
        values: r.equity.p50,
        color: `var(--s-${r.id})`,
        dashed: r.id === "cash",
      })) ?? [],
    [out],
  );
  const ddSeries: Series[] = useMemo(
    () => out?.results.map((r) => ({ id: r.id, label: catalogById[r.id].short, values: r.drawdown, color: `var(--s-${r.id})`, dashed: r.id === "cash" })) ?? [],
    [out],
  );
  const bandOf = multi && out ? out.results.find((r) => r.id === (focus ?? "hold")) : undefined;

  const at = hover ?? (out ? out.index.length - 1 : 0);
  const ledger = out ? [...out.results].sort((a, b) => b.equity.p50[at] - a.equity.p50[at]) : [];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const meta = out
    ? [
        settings.mode === "history" && history ? `${history.name}` : null,
        out.dates ? `${longDate(out.dates[0])} to ${longDate(out.dates[out.dates.length - 1])}` : `${((out.days - 1) / 252).toFixed(0)} year horizon`,
        multi ? `${out.paths} markets` : `${out.days.toLocaleString()} sessions`,
        `computed in ${Math.max(1, Math.round(out.elapsedMs))} ms`,
      ].filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-6">
      <Masthead />

      <section aria-label="Quick ticker search" className="mt-4 border-b border-ink pb-4 lg:hidden">
        <TickerSearch
          value={settings.mode === "simulated" ? "" : settings.symbol}
          onSubmit={(symbol) => set({ symbol, mode: settings.mode === "simulated" ? "history" : settings.mode })}
        />
        <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {ERAS.map((era) => (
            <button
              key={era.label}
              type="button"
              onClick={() => set({ from: era.from(), to: era.to(), mode: settings.mode === "simulated" ? "history" : settings.mode })}
              className="shrink-0 border border-rule px-2.5 py-1 text-[0.8rem] italic text-ink-soft"
            >
              {era.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[0.78rem] italic text-ink-faint">Every other setting lives on the desk further down.</p>
      </section>

      <section className="mt-5 grid gap-4 border-b border-ink pb-5 md:grid-cols-[1fr_auto] md:items-end">
        <p className="max-w-[78ch] text-[1.05rem] leading-relaxed text-ink-soft">
          <span className="kicker mr-2 text-accent">New here?</span>
          Options sellers promise steady income and trend followers promise to dodge crashes. Compario replays eleven ways to own a stock on the same
          prices, with the same money and the same costs, so you can see what each one really earned and what it risked to get there.
        </p>
        <div className="flex gap-2 self-start md:self-end">
          <Link href="/tldr" className="kicker border border-ink bg-ink px-3 py-2 text-center text-paper hover:bg-transparent hover:text-ink">
            Just the numbers
          </Link>
          <Link href="/guide" className="kicker border border-ink px-3 py-2 text-center hover:bg-ink hover:text-paper">
            Read the guide
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="order-2 lg:order-1">
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:border-r lg:border-rule lg:pr-6">
            <p className="kicker mb-1 text-accent">The desk</p>
            <p className="mb-3 text-[0.9rem] italic leading-snug text-ink-soft">Every dial below reruns the whole comparison. The address bar keeps your settings.</p>
            <Desk s={settings} set={set} onReset={() => setSettings(defaultSettings())} />
          </div>
        </aside>

        <main className="order-1 min-w-0 lg:order-2">
          <div className="kicker flex items-center gap-2 text-ink-soft">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${status === "ready" ? "bg-gain" : status === "error" ? "bg-loss" : "animate-pulse bg-accent"}`} />
            {STATUS_COPY[status]}
            <span className="flex-1" />
            <button type="button" onClick={copyLink} className="kicker border border-ink px-2 py-1 hover:bg-ink hover:text-paper">
              {copied ? "Link copied" : "Copy link to this run"}
            </button>
          </div>

          {error && status === "error" && (
            <div className="mt-4 border-l-4 border-loss bg-paper-deep px-4 py-3">
              <p className="font-semibold">{error}</p>
              <p className="text-[0.9rem] italic text-ink-soft">Check the ticker and dates, or switch the market to Synthetic.</p>
            </div>
          )}

          <h2
            className={`mt-3 max-w-[22ch] text-[clamp(2rem,4.6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.02em] transition-opacity ${status === "ready" ? "" : "opacity-60"}`}
            style={{ fontVariationSettings: '"opsz" 60' }}
          >
            {story?.headline ?? "Eleven ways to own a stock, one tape to judge them"}
          </h2>
          <p className="dropcap mt-4 max-w-[68ch] text-[1.12rem] leading-relaxed text-ink-soft">
            {story?.deck ?? "Loading the first comparison. Pick a ticker or a synthetic market on the desk and every strategy is replayed day by day, with option prices, fees and assignments accounted for."}
          </p>
          {meta.length > 0 && <p className="figures mt-3 text-[0.72rem] uppercase tracking-wide text-ink-faint">{meta.join("  /  ")}</p>}

          <div className="mt-6">
            <Roster selected={settings.strategies} onChange={(strategies) => set({ strategies })} focus={focus} onFocus={setFocus} />
          </div>

          {out && (
            <>
              <div className="mt-6 border-t border-ink pt-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="kicker">
                    {multi ? "Median account value" : "Account value"}, {pointLabel(out, at)}
                  </p>
                  <div className="flex gap-3 text-[0.8rem]">
                    {(["Linear", "Log"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => set({ log: k === "Log" })}
                        className={`kicker ${settings.log === (k === "Log") ? "text-accent underline underline-offset-4" : "text-ink-faint hover:text-ink"}`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="figures mt-1 flex min-h-[2.6rem] flex-wrap content-start gap-x-4 gap-y-0.5 text-[0.76rem]">
                  {ledger.map((r) => (
                    <span key={r.id} className={focus && focus !== r.id ? "opacity-40" : ""}>
                      <span style={{ color: `var(--s-${r.id})` }}>{catalogById[r.id].short}</span> {money(r.equity.p50[at])}
                    </span>
                  ))}
                </div>
              </div>
              <TimeChart
                ariaLabel="Account value over time for each strategy"
                index={out.index}
                dates={out.dates}
                series={equitySeries}
                band={bandOf ? { low: bandOf.equity.p10, high: bandOf.equity.p90, color: `var(--s-${bandOf.id})` } : null}
                log={settings.log}
                height={420}
                yFormat={(v) => money(v)}
                hover={hover}
                onHover={setHover}
                focus={focus}
                onFocus={setFocus}
                endLabels
              />
              {multi && bandOf && (
                <p className="mt-1 text-[0.78rem] italic text-ink-faint">
                  Shaded: the middle 80% of outcomes for {catalogById[bandOf.id].name.toLowerCase()}. Hover a name to see its range.
                </p>
              )}

              <div className="mt-10">
                <SectionHead kicker="Below the waterline" title="How far each one fell from its high" />
                <TimeChart
                  ariaLabel="Drawdown from peak for each strategy"
                  index={out.index}
                  dates={out.dates}
                  series={ddSeries}
                  height={190}
                  yFormat={(v) => pct(v, 0)}
                  hover={hover}
                  onHover={setHover}
                  focus={focus}
                  onFocus={setFocus}
                  baseline={0}
                  endLabels
                />
              </div>

              <div className="mt-10">
                <SectionHead kicker="The standings" title="Ranked, with the receipts" />
                <Standings out={out} rank={settings.rank} onRank={(rank) => set({ rank })} focus={focus} onFocus={setFocus} />
              </div>

              <div className="mt-10">
                {multi ? (
                  <>
                    <SectionHead kicker="The spread" title="Every market, not just the middle one" />
                    <Distribution out={out} capital={settings.capital} focus={focus} onFocus={setFocus} />
                  </>
                ) : (
                  <>
                    <SectionHead kicker="Year by year" title="Calendar returns" />
                    <Yearly out={out} focus={focus} onFocus={setFocus} />
                  </>
                )}
              </div>

              <div className="mt-10">
                <SectionHead kicker="Field notes" title="What each one actually did" />
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                  {out.results.map((r) => (
                    <article key={r.id} className="border-t border-rule pt-3" onPointerEnter={() => setFocus(r.id)} onPointerLeave={() => setFocus(null)}>
                      <p className="kicker" style={{ color: `var(--s-${r.id})` }}>
                        {catalogById[r.id].family}
                      </p>
                      <h4 className="text-lg font-semibold leading-tight">{catalogById[r.id].name}</h4>
                      <p className="mt-1 text-[0.93rem] leading-snug text-ink-soft">{catalogById[r.id].summary}</p>
                      <dl className="figures mt-2 grid grid-cols-2 gap-x-3 text-[0.74rem]">
                        <dt className="text-ink-faint">Annual return</dt>
                        <dd className="text-right">{signedPct(r.metrics.cagr)}</dd>
                        <dt className="text-ink-faint">Worst drawdown</dt>
                        <dd className="text-right">{signedPct(r.metrics.maxDrawdown, 0)}</dd>
                        <dt className="text-ink-faint">Time in the market</dt>
                        <dd className="text-right">{pct(r.exposure, 0)}</dd>
                        {r.cycles > 0 && (
                          <>
                            <dt className="text-ink-faint">Option cycles</dt>
                            <dd className="text-right">{r.cycles.toFixed(0)}</dd>
                            <dt className="text-ink-faint">Net premium</dt>
                            <dd className="text-right">{money(r.premium)}</dd>
                            <dt className="text-ink-faint">Fees paid</dt>
                            <dd className="text-right">{money(r.fees)}</dd>
                          </>
                        )}
                      </dl>
                    </article>
                  ))}
                </div>
              </div>
            </>
          )}

          <Methodology />
        </main>
      </div>

      <footer className="mt-16 border-t-2 border-ink pt-3">
        <div className="kicker flex flex-wrap justify-between gap-2 text-ink-faint">
          <span>Compario. Printed in the browser, {catalog.length} strategies.</span>
          <span>For education. Past tape does not promise future tape.</span>
        </div>
      </footer>
    </div>
  );
}
