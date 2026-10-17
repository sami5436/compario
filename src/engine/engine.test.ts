import { describe, expect, it } from "vitest";
import { bsDelta, bsPrice, strikeForDelta } from "./blackScholes";
import { catalog } from "./catalog";
import { simulatedPaths, impliedVolSeries } from "./paths";
import { runBacktest } from "./run";
import { simulators } from "./strategies";
import { defaultParams, type Params } from "./types";

const flat = (n: number, v = 100) => Float64Array.from({ length: n }, () => v);
const ivFlat = (n: number, v = 0.25) => Float64Array.from({ length: n }, () => v);

describe("black scholes", () => {
  it("satisfies put call parity", () => {
    const [s, k, t, r, v] = [100, 105, 0.5, 0.04, 0.3];
    const lhs = bsPrice("call", s, k, t, r, v) - bsPrice("put", s, k, t, r, v);
    expect(lhs).toBeCloseTo(s - k * Math.exp(-r * t), 6);
  });

  it("finds the strike for a target delta", () => {
    const k = strikeForDelta("call", 100, 0.3, 30 / 365, 0.04, 0.25);
    expect(bsDelta("call", 100, k, 30 / 365, 0.04, 0.25)).toBeCloseTo(0.3, 4);
    const kp = strikeForDelta("put", 100, 0.3, 30 / 365, 0.04, 0.25);
    expect(bsDelta("put", 100, kp, 30 / 365, 0.04, 0.25)).toBeCloseTo(-0.3, 4);
    expect(kp).toBeLessThan(100);
    expect(k).toBeGreaterThan(100);
  });
});

describe("strategies", () => {
  const p: Params = { ...defaultParams, capital: 100_000 };

  it("buy and hold tracks the price", () => {
    const prices = Float64Array.from({ length: 300 }, (_, i) => 100 + i);
    const run = simulators.hold(prices, ivFlat(300), p);
    expect(run.equity[299]).toBeCloseTo(100_000 * (399 / 100), 4);
  });

  it("cash compounds at the risk free rate", () => {
    const run = simulators.cash(flat(253), ivFlat(253), p);
    expect(run.equity[252] / 100_000 - 1).toBeCloseTo(Math.pow(1 + 0.04 / 252, 252) - 1, 8);
  });

  it("every income strategy earns premium on a flat market", () => {
    const n = 253;
    for (const id of ["coveredCall", "cashPut", "wheel", "putSpread"] as const) {
      const run = simulators[id](flat(n), ivFlat(n), p);
      expect(run.premium, id).toBeGreaterThan(0);
      expect(run.equity[n - 1], id).toBeGreaterThan(100_000);
      expect(run.cycles, id).toBeGreaterThan(8);
    }
  });

  it("the wheel gets assigned in a selloff and holds shares", () => {
    const prices = Float64Array.from({ length: 120 }, (_, i) => 100 - i * 0.3);
    const run = simulators.wheel(prices, ivFlat(120), p);
    expect(run.assignments).toBeGreaterThanOrEqual(1);
    expect(run.exposure).toBeGreaterThan(0.5);
  });

  it("married puts cap the loss in a crash", () => {
    const prices = Float64Array.from({ length: 60 }, (_, i) => (i < 10 ? 100 : 50));
    const insured = simulators.marriedPut(prices, ivFlat(60), p);
    const naked = simulators.hold(prices, ivFlat(60), p);
    expect(insured.equity[59]).toBeGreaterThan(naked.equity[59] * 1.4);
  });

  it("whole contracts leaves small accounts uncovered", () => {
    const run = simulators.coveredCall(flat(100, 500), ivFlat(100), { ...p, capital: 20_000, wholeContracts: true });
    expect(run.cycles).toBe(0);
  });
});

describe("simulation", () => {
  it("hits the requested expected return on average", () => {
    const paths = simulatedPaths({ years: 1, drift: 0.08, vol: 0.2, jumpsPerYear: 1, jumpMean: -0.1, jumpVol: 0.05, paths: 4000, seed: 7 });
    const mean = paths.reduce((a, x) => a + x[x.length - 1] / 100, 0) / paths.length;
    expect(mean).toBeGreaterThan(1.06);
    expect(mean).toBeLessThan(1.1);
  });

  it("estimates implied vol near the true vol", () => {
    const [path] = simulatedPaths({ years: 3, drift: 0.05, vol: 0.3, jumpsPerYear: 0, jumpMean: 0, jumpVol: 0, paths: 1, seed: 3 });
    const iv = impliedVolSeries(path, 60, 1, 0);
    const avg = iv.reduce((a, b) => a + b, 0) / iv.length;
    expect(avg).toBeGreaterThan(0.25);
    expect(avg).toBeLessThan(0.35);
  });

  it("runs every strategy across many paths quickly", () => {
    const out = runBacktest({
      market: { kind: "simulated", years: 10, drift: 0.08, vol: 0.2, jumpsPerYear: 0.5, jumpMean: -0.08, jumpVol: 0.05, paths: 100, seed: 1 },
      params: defaultParams,
      strategies: catalog.map((s) => s.id),
    });
    expect(out.results).toHaveLength(catalog.length);
    for (const r of out.results) expect(Number.isFinite(r.metrics.cagr), r.id).toBe(true);
    console.log(`100 paths x 10y x ${catalog.length} strategies: ${out.elapsedMs.toFixed(0)}ms`);
    console.table(out.results.map((r) => ({ id: r.id, cagr: r.metrics.cagr.toFixed(4), dd: r.metrics.maxDrawdown.toFixed(3), sharpe: r.metrics.sharpe.toFixed(2), beat: r.beatHoldOdds })));
  });
});
