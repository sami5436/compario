"use client";

import { catalogById } from "@/engine/catalog";
import type { RunOutput } from "@/engine/run";
import { signedPct } from "@/lib/format";

function tint(v: number) {
  const strength = Math.min(1, Math.abs(v) / 0.35);
  const color = v >= 0 ? "var(--gain)" : "var(--loss)";
  return `color-mix(in oklab, ${color} ${Math.round(strength * 38)}%, transparent)`;
}

export function Yearly({ out, focus, onFocus }: { out: RunOutput; focus: string | null; onFocus: (id: string | null) => void }) {
  if (!out.years.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[0.8rem]">
        <thead>
          <tr className="border-b border-ink">
            <th className="kicker px-2 py-2 text-left">Year</th>
            {out.results.map((r) => (
              <th
                key={r.id}
                className={`kicker whitespace-nowrap px-1.5 py-2 text-right ${focus === r.id ? "text-accent" : ""}`}
                onPointerEnter={() => onFocus(r.id)}
                onPointerLeave={() => onFocus(null)}
              >
                <span className="mb-1 block h-[3px] w-full" style={{ background: `var(--s-${r.id})` }} />
                {catalogById[r.id].short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {out.years.map((year, yi) => {
            const best = Math.max(...out.results.map((r) => r.yearly[yi]));
            return (
              <tr key={year} className="border-b border-rule">
                <td className="figures px-2 py-1.5 text-ink-soft">
                  {year}
                  {(yi === 0 || yi === out.years.length - 1) && <span className="text-ink-faint">*</span>}
                </td>
                {out.results.map((r) => {
                  const v = r.yearly[yi];
                  return (
                    <td
                      key={r.id}
                      className={`figures whitespace-nowrap px-1.5 py-1.5 text-right ${v === best ? "font-semibold underline decoration-1 underline-offset-2" : ""}`}
                      style={{ background: tint(v), opacity: focus && focus !== r.id ? 0.4 : 1 }}
                    >
                      {signedPct(v, 1)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[0.78rem] italic text-ink-faint">Underlined is the best strategy that year. Starred years are partial.</p>
    </div>
  );
}
