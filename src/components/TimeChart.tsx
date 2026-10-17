"use client";

import { useMemo, type PointerEvent } from "react";
import { logTicks, niceTicks, spreadLabels } from "./scales";
import { useWidth } from "./useWidth";

export interface Series {
  id: string;
  label: string;
  values: number[];
  color: string;
  dashed?: boolean;
}

interface Props {
  index: number[];
  dates: string[] | null;
  series: Series[];
  band?: { low: number[]; high: number[]; color: string } | null;
  log?: boolean;
  height: number;
  yFormat: (v: number) => string;
  hover: number | null;
  onHover: (i: number | null) => void;
  focus: string | null;
  onFocus: (id: string | null) => void;
  endLabels?: boolean;
  baseline?: number;
  ariaLabel: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function xTicks(index: number[], dates: string[] | null, maxTicks: number): { i: number; label: string }[] {
  const out: { i: number; label: string }[] = [];
  if (dates) {
    const first = Number(dates[0].slice(0, 4));
    const last = Number(dates[dates.length - 1].slice(0, 4));
    const span = last - first;
    if (span < 2) {
      let prev = "";
      dates.forEach((d, i) => {
        const m = d.slice(0, 7);
        if (m !== prev && i > 0 && Number(d.slice(5, 7)) % (span < 1 ? 2 : 3) === 1) out.push({ i, label: `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(2, 4)}` });
        prev = m;
      });
      return out;
    }
    const step = [1, 2, 5, 10].find((s) => span / s <= maxTicks) ?? 10;
    let prev = dates[0].slice(0, 4);
    dates.forEach((d, i) => {
      const y = d.slice(0, 4);
      if (y !== prev && Number(y) % step === 0) out.push({ i, label: y });
      prev = y;
    });
    return out;
  }
  const yrs = index[index.length - 1] / 252;
  const step = [1, 2, 5, 10].find((s) => yrs / s <= maxTicks) ?? 10;
  for (let y = step; y <= yrs + 1e-6; y += step) {
    const target = y * 252;
    let best = 0;
    index.forEach((d, i) => Math.abs(d - target) < Math.abs(index[best] - target) && (best = i));
    out.push({ i: best, label: `Yr ${y}` });
  }
  return out;
}

export function TimeChart(p: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const narrow = width < 560;
  const m = { top: 14, right: p.endLabels ? (narrow ? 64 : 112) : 12, bottom: 24, left: narrow ? 44 : 54 };
  const iw = width - m.left - m.right;
  const ih = p.height - m.top - m.bottom;
  const n = p.index.length;

  const { lo, hi } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    const scan = (arr: number[]) => arr.forEach((v) => {
      if (!Number.isFinite(v) || (p.log && v <= 0)) return;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    });
    p.series.forEach((s) => scan(s.values));
    if (p.band) {
      scan(p.band.low);
      scan(p.band.high);
    }
    if (p.baseline !== undefined) {
      lo = Math.min(lo, p.baseline);
      hi = Math.max(hi, p.baseline);
    }
    if (!Number.isFinite(lo)) return { lo: 0, hi: 1 };
    if (hi - lo < 1e-9) return { lo: lo * 0.95, hi: hi * 1.05 + 1e-9 };
    if (p.log) return { lo: lo / 1.04, hi: hi * 1.04 };
    const pad = (hi - lo) * 0.04;
    return { lo: lo - pad, hi: hi + pad };
  }, [p.series, p.band, p.log, p.baseline]);

  const x = (i: number) => m.left + (n > 1 ? (i / (n - 1)) * iw : 0);
  const y = (v: number) => {
    const t = p.log ? (Math.log(Math.max(v, lo)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (v - lo) / (hi - lo);
    return m.top + (1 - t) * ih;
  };
  const yTicks = p.log ? logTicks(lo, hi) : niceTicks(lo, hi, narrow ? 4 : 5);
  const ticksX = xTicks(p.index, p.dates, narrow ? 4 : 8);

  const path = (vals: number[]) => {
    let d = "";
    vals.forEach((v, i) => {
      if (!Number.isFinite(v) || (p.log && v <= 0)) return;
      d += `${d ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    });
    return d;
  };

  const bandPath = p.band
    ? `${p.band.high.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")}${p.band.low
        .map((v, i) => [i, v] as const)
        .reverse()
        .map(([i, v]) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join("")}Z`
    : null;

  const ends = p.series.map((s) => y(s.values[n - 1]));
  const labelY = p.endLabels ? spreadLabels(ends, 13, m.top + 4, m.top + ih) : [];

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    p.onHover(Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1)))));
  };

  const ordered = [...p.series].sort((a, b) => (a.id === p.focus ? 1 : b.id === p.focus ? -1 : 0));

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={p.height} role="img" aria-label={p.ariaLabel} className="block select-none overflow-visible">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={m.left} x2={m.left + iw} y1={y(t)} y2={y(t)} stroke="var(--rule)" strokeWidth={1} />
            <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="figures" fontSize={10} fill="var(--ink-faint)">
              {p.yFormat(t)}
            </text>
          </g>
        ))}
        {p.baseline !== undefined && (
          <line x1={m.left} x2={m.left + iw} y1={y(p.baseline)} y2={y(p.baseline)} stroke="var(--ink)" strokeWidth={1} />
        )}
        <line x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} stroke="var(--ink)" strokeWidth={1} />
        {ticksX.map((t) => (
          <g key={`${t.i}${t.label}`}>
            <line x1={x(t.i)} x2={x(t.i)} y1={m.top + ih} y2={m.top + ih + 4} stroke="var(--ink)" />
            <text x={x(t.i)} y={m.top + ih + 16} textAnchor="middle" className="figures" fontSize={10} fill="var(--ink-soft)">
              {t.label}
            </text>
          </g>
        ))}

        {bandPath && p.band && <path d={bandPath} fill={p.band.color} opacity={0.14} />}

        {ordered.map((s) => {
          const dim = p.focus !== null && p.focus !== s.id;
          const strong = p.focus === s.id || s.id === "hold";
          return (
            <path
              key={s.id}
              d={path(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={strong ? 2.2 : 1.4}
              strokeDasharray={s.dashed ? "2 3" : undefined}
              strokeLinejoin="round"
              opacity={dim ? 0.18 : 1}
              style={{ transition: "opacity 160ms" }}
            />
          );
        })}

        {p.endLabels &&
          p.series.map((s, k) => (
            <g
              key={s.id}
              opacity={p.focus !== null && p.focus !== s.id ? 0.35 : 1}
              onPointerEnter={() => p.onFocus(s.id)}
              onPointerLeave={() => p.onFocus(null)}
              className="cursor-default"
            >
              <line x1={m.left + iw + 2} x2={m.left + iw + 8} y1={ends[k]} y2={labelY[k]} stroke={s.color} />
              <text x={m.left + iw + 11} y={labelY[k]} dy="0.32em" fontSize={narrow ? 10 : 11.5} fill={s.color} fontWeight={p.focus === s.id ? 700 : 500}>
                {s.label}
              </text>
            </g>
          ))}

        {p.hover !== null && (
          <g pointerEvents="none">
            <line x1={x(p.hover)} x2={x(p.hover)} y1={m.top} y2={m.top + ih} stroke="var(--ink)" strokeWidth={0.75} />
            {p.series.map((s) =>
              Number.isFinite(s.values[p.hover!]) ? (
                <circle key={s.id} cx={x(p.hover!)} cy={y(s.values[p.hover!])} r={2.6} fill="var(--paper)" stroke={s.color} strokeWidth={1.5} />
              ) : null,
            )}
          </g>
        )}

        <rect
          x={m.left}
          y={m.top}
          width={iw}
          height={ih}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => p.onHover(null)}
          style={{ touchAction: "pan-y" }}
        />
      </svg>
    </div>
  );
}
