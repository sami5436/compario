import { percentile } from "./math";
import { computeMetrics, drawdownSeries } from "./metrics";
import { bootstrapPaths, impliedVolSeries, simulatedPaths, type BootstrapMarket, type SimulatedMarket } from "./paths";
import { simulators } from "./strategies";
import type { Metrics, Params, StrategyId } from "./types";

export type MarketSpec =
  | { kind: "history"; symbol: string; dates: string[]; prices: number[] }
  | ({ kind: "simulated" } & SimulatedMarket)
  | ({ kind: "bootstrap"; symbol: string } & BootstrapMarket);

export interface RunInput {
  market: MarketSpec;
  params: Params;
  strategies: StrategyId[];
  /** Maximum number of points kept for each plotted series. */
  resolution?: number;
}

export interface Band {
  p10: number[];
  p50: number[];
  p90: number[];
}

export interface StrategyResult {
  id: StrategyId;
  /** Median across paths; on a single history this is just the value. */
  metrics: Metrics;
  cagrLow: number;
  cagrHigh: number;
  /** Share of paths that ended below the starting capital. */
  lossOdds: number;
  /** Share of paths that ended ahead of buy and hold. */
  beatHoldOdds: number;
  equity: Band;
  drawdown: number[];
  finals: number[];
  premium: number;
  fees: number;
  assignments: number;
  cycles: number;
  exposure: number;
  /** Calendar year returns, aligned with RunOutput.years. Only for a real history. */
  yearly: number[];
}

export interface RunOutput {
  paths: number;
  days: number;
  /** Day index of every plotted point. */
  index: number[];
  /** Calendar dates of plotted points for a real history, otherwise null. */
  dates: string[] | null;
  underlying: Band;
  /** Calendar years covered by a real history, otherwise empty. */
  years: string[];
  results: StrategyResult[];
  elapsedMs: number;
}

function sampleIndex(n: number, max: number): number[] {
  if (n <= max) return Array.from({ length: n }, (_, i) => i);
  const out: number[] = [];
  for (let k = 0; k < max; k++) out.push(Math.round((k * (n - 1)) / (max - 1)));
  return out;
}

function band(rows: Float64Array[], width: number): Band {
  const p10: number[] = [];
  const p50: number[] = [];
  const p90: number[] = [];
  const col = new Float64Array(rows.length);
  for (let i = 0; i < width; i++) {
    for (let k = 0; k < rows.length; k++) col[k] = rows[k][i];
    col.sort();
    p10.push(percentile(col, 0.1));
    p50.push(percentile(col, 0.5));
    p90.push(percentile(col, 0.9));
  }
  return { p10, p50, p90 };
}

/** Last day index of each calendar year, plus the first day as the opening mark. */
function yearMarks(dates: string[]): { labels: string[]; ends: number[] } {
  const labels: string[] = [];
  const ends: number[] = [];
  for (let i = 0; i < dates.length; i++) {
    const y = dates[i].slice(0, 4);
    if (i === dates.length - 1 || dates[i + 1].slice(0, 4) !== y) {
      labels.push(y);
      ends.push(i);
    }
  }
  return { labels, ends };
}

function median(values: number[]): number {
  return percentile([...values].sort((a, b) => a - b), 0.5);
}

function marketPaths(market: MarketSpec): Float64Array[] {
  if (market.kind === "history") return [Float64Array.from(market.prices)];
  if (market.kind === "simulated") return simulatedPaths(market);
  return bootstrapPaths(market);
}

export function runBacktest(input: RunInput): RunOutput {
  const started = performance.now();
  const { params, market } = input;
  const paths = marketPaths(market);
  const days = paths[0].length;
  const index = sampleIndex(days, input.resolution ?? 360);
  const ids: StrategyId[] = input.strategies.includes("hold") ? input.strategies : ["hold", ...input.strategies];

  const sampled = (series: ArrayLike<number>) => Float64Array.from(index, (i) => series[i]);
  const underlyingRows = paths.map((path) => sampled(Array.from(path, (v) => (v / path[0]) * params.capital)));

  const marks = market.kind === "history" ? yearMarks(market.dates) : { labels: [], ends: [] };
  type Acc = { yearly: number[]; metrics: Metrics[]; equity: Float64Array[]; drawdown: Float64Array[]; finals: number[]; premium: number; fees: number; assignments: number; cycles: number; exposure: number };
  const acc = new Map<StrategyId, Acc>();
  for (const id of ids) acc.set(id, { yearly: [], metrics: [], equity: [], drawdown: [], finals: [], premium: 0, fees: 0, assignments: 0, cycles: 0, exposure: 0 });

  const holdFinals: number[] = [];
  const count1 = paths.length;
  for (const path of paths) {
    const iv = impliedVolSeries(path, params.volLookback, params.ivMultiplier, params.ivFloor);
    for (const id of ids) {
      const run = simulators[id](path, iv, params);
      const a = acc.get(id)!;
      a.metrics.push(computeMetrics(run.equity, params.riskFree));
      a.equity.push(sampled(run.equity));
      a.drawdown.push(sampled(drawdownSeries(run.equity)));
      a.finals.push(run.equity[days - 1]);
      a.premium += run.premium;
      a.fees += run.fees;
      a.assignments += run.assignments;
      a.cycles += run.cycles;
      a.exposure += run.exposure;
      if (count1 === 1) {
        let prev = run.equity[0];
        a.yearly = marks.ends.map((end) => {
          const r = prev > 0 ? run.equity[end] / prev - 1 : 0;
          prev = run.equity[end];
          return r;
        });
      }
      if (id === "hold") holdFinals.push(run.equity[days - 1]);
    }
  }

  const count = paths.length;
  const results: StrategyResult[] = [];
  for (const id of ids.filter((x) => input.strategies.includes(x))) {
    const a = acc.get(id)!;
    const keys = Object.keys(a.metrics[0]) as (keyof Metrics)[];
    const metrics = Object.fromEntries(keys.map((k) => [k, median(a.metrics.map((m) => m[k]))])) as unknown as Metrics;
    const cagrs = a.metrics.map((m) => m.cagr).sort((x, y) => x - y);
    const dd = band(a.drawdown, index.length).p50;
    results.push({
      id,
      metrics,
      cagrLow: percentile(cagrs, 0.05),
      cagrHigh: percentile(cagrs, 0.95),
      lossOdds: a.finals.filter((f) => f < params.capital).length / count,
      beatHoldOdds: a.finals.filter((f, i) => f > holdFinals[i] + 1e-6).length / count,
      equity: band(a.equity, index.length),
      drawdown: dd,
      finals: a.finals,
      premium: a.premium / count,
      fees: a.fees / count,
      assignments: a.assignments / count,
      cycles: a.cycles / count,
      exposure: a.exposure / count,
      yearly: a.yearly,
    });
  }

  return {
    paths: count,
    days,
    index,
    dates: market.kind === "history" ? index.map((i) => market.dates[i]) : null,
    underlying: band(underlyingRows, index.length),
    years: marks.labels,
    results,
    elapsedMs: performance.now() - started,
  };
}
