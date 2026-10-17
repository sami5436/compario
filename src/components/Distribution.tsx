"use client";

import { catalogById } from "@/engine/catalog";
import type { RunOutput } from "@/engine/run";
import { pct } from "@/lib/format";
import { percentile } from "@/engine/math";
import { niceTicks } from "./scales";
import { useWidth } from "./useWidth";

export function Distribution({ out, capital, focus, onFocus }: { out: RunOutput; capital: number; focus: string | null; onFocus: (id: string | null) => void }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const years = (out.days - 1) / 252;
  const rows = out.results
    .map((r) => {
      const cagrs = r.finals.map((f) => (f > 0 ? Math.pow(f / capital, 1 / years) - 1 : -1)).sort((a, b) => a - b);
      return { id: r.id, q: [0.05, 0.25, 0.5, 0.75, 0.95].map((p) => percentile(cagrs, p)) };
    })
    .sort((a, b) => b.q[2] - a.q[2]);

  const narrow = width < 560;
  const m = { left: narrow ? 92 : 150, right: 16, top: 8, bottom: 26 };
  const rowH = 24;
  const h = m.top + m.bottom + rowH * rows.length;
  const lo = Math.min(...rows.map((r) => r.q[0]), 0);
  const hi = Math.max(...rows.map((r) => r.q[4]), 0.01);
  const x = (v: number) => m.left + ((v - lo) / (hi - lo)) * (width - m.left - m.right);
  const hold = rows.find((r) => r.id === "hold");

  return (
    <div ref={ref}>
      <svg width={width} height={h} role="img" aria-label="Spread of annual returns across simulated markets">
        {niceTicks(lo, hi, narrow ? 4 : 6).map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={m.top} y2={h - m.bottom} stroke={Math.abs(t) < 1e-9 ? "var(--ink)" : "var(--rule)"} />
            <text x={x(t)} y={h - m.bottom + 15} textAnchor="middle" className="figures" fontSize={10} fill="var(--ink-faint)">
              {pct(t, 0)}
            </text>
          </g>
        ))}
        {hold && <line x1={x(hold.q[2])} x2={x(hold.q[2])} y1={m.top} y2={h - m.bottom} stroke="var(--s-hold)" strokeDasharray="1 3" />}
        {rows.map((r, i) => {
          const cy = m.top + i * rowH + rowH / 2;
          const c = `var(--s-${r.id})`;
          const dim = focus !== null && focus !== r.id;
          return (
            <g key={r.id} opacity={dim ? 0.3 : 1} onPointerEnter={() => onFocus(r.id)} onPointerLeave={() => onFocus(null)}>
              <rect x={0} y={cy - rowH / 2} width={width} height={rowH} fill="transparent" />
              <text x={m.left - 10} y={cy} dy="0.32em" textAnchor="end" fontSize={narrow ? 11 : 12.5}>
                {narrow ? catalogById[r.id].short : catalogById[r.id].name}
              </text>
              <line x1={x(r.q[0])} x2={x(r.q[4])} y1={cy} y2={cy} stroke={c} strokeWidth={1} />
              <rect x={x(r.q[1])} y={cy - 5} width={Math.max(1, x(r.q[3]) - x(r.q[1]))} height={10} fill={c} opacity={0.28} stroke={c} />
              <line x1={x(r.q[2])} x2={x(r.q[2])} y1={cy - 8} y2={cy + 8} stroke={c} strokeWidth={2.5} />
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[0.78rem] italic text-ink-faint">
        Thin line spans the 5th to 95th percentile, the box the middle half, the tick the median. Dotted rule marks buy and hold.
      </p>
    </div>
  );
}
