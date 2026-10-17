"use client";

import { catalogById } from "@/engine/catalog";
import type { RunOutput } from "@/engine/run";
import type { Metrics } from "@/engine/types";
import { money, pct, ratio, signedPct } from "@/lib/format";
import { metricLabels, rankResults } from "@/lib/story";

interface Props {
  out: RunOutput;
  rank: keyof Metrics;
  onRank: (k: keyof Metrics) => void;
  focus: string | null;
  onFocus: (id: string | null) => void;
}

const COLUMNS: { key: keyof Metrics; fmt: (v: number) => string }[] = [
  { key: "cagr", fmt: (v) => signedPct(v) },
  { key: "totalReturn", fmt: (v) => signedPct(v, 0) },
  { key: "maxDrawdown", fmt: (v) => signedPct(v, 0) },
  { key: "vol", fmt: (v) => pct(v) },
  { key: "sharpe", fmt: ratio },
  { key: "sortino", fmt: ratio },
  { key: "worstMonth", fmt: (v) => signedPct(v) },
  { key: "finalValue", fmt: (v) => money(v) },
];

export function Standings({ out, rank, onRank, focus, onFocus }: Props) {
  const rows = rankResults(out.results, rank);
  const multi = out.paths > 1;
  const th = "kicker whitespace-nowrap px-2 py-2 text-right font-semibold";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-[0.88rem]">
        <thead>
          <tr className="border-b border-ink">
            <th className="kicker w-6 px-1 py-2 text-left">No.</th>
            <th className="kicker px-2 py-2 text-left">Strategy</th>
            {COLUMNS.map((c) => (
              <th key={c.key} className={th}>
                <button
                  type="button"
                  onClick={() => onRank(c.key)}
                  className={`kicker underline-offset-4 hover:underline ${rank === c.key ? "text-accent underline" : ""}`}
                  aria-pressed={rank === c.key}
                >
                  {metricLabels[c.key]}
                </button>
              </th>
            ))}
            {multi && <th className={th}>Beat hold</th>}
            {multi && <th className={th}>Odds of loss</th>}
            <th className={th}>Net premium</th>
            <th className={th}>Assigned</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.id}
              onPointerEnter={() => onFocus(r.id)}
              onPointerLeave={() => onFocus(null)}
              className={`border-b border-rule transition-colors ${focus === r.id ? "bg-paper-deep" : ""}`}
            >
              <td className="figures px-1 py-2 text-ink-faint">{String(i + 1).padStart(2, "0")}</td>
              <td className="whitespace-nowrap px-2 py-2">
                <span className="mr-2 inline-block h-[3px] w-4 align-middle" style={{ background: `var(--s-${r.id})` }} />
                <span className={r.id === "hold" ? "font-semibold" : ""}>{catalogById[r.id].name}</span>
              </td>
              {COLUMNS.map((c) => {
                const v = r.metrics[c.key];
                const tone = c.key === "cagr" || c.key === "totalReturn" ? (v >= 0 ? "text-gain" : "text-loss") : "";
                return (
                  <td key={c.key} className={`figures whitespace-nowrap px-2 py-2 text-right ${tone} ${rank === c.key ? "font-semibold" : ""}`}>
                    {c.fmt(v)}
                    {multi && c.key === "cagr" && (
                      <span className="block text-[0.68rem] font-normal text-ink-faint">
                        {pct(r.cagrLow, 0)} to {pct(r.cagrHigh, 0)}
                      </span>
                    )}
                  </td>
                );
              })}
              {multi && <td className="figures px-2 py-2 text-right">{r.id === "hold" ? "" : pct(r.beatHoldOdds, 0)}</td>}
              {multi && <td className="figures px-2 py-2 text-right">{pct(r.lossOdds, 0)}</td>}
              <td className="figures whitespace-nowrap px-2 py-2 text-right">{r.cycles > 0 ? money(r.premium) : ""}</td>
              <td className="figures px-2 py-2 text-right">{r.cycles > 0 ? `${r.assignments.toFixed(multi ? 1 : 0)} of ${r.cycles.toFixed(0)}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {multi && (
        <p className="mt-2 text-[0.78rem] italic text-ink-faint">
          Figures are medians across every market. The small range under each annual return runs from the 5th to the 95th percentile.
        </p>
      )}
    </div>
  );
}
