import { mulberry32, normalSampler, poisson, TRADING_DAYS } from "./math";

export interface SimulatedMarket {
  years: number;
  /** Expected annual return, as a decimal. */
  drift: number;
  vol: number;
  /** Average number of sudden gaps per year. */
  jumpsPerYear: number;
  /** Average gap size in log terms, negative for crashes. */
  jumpMean: number;
  jumpVol: number;
  paths: number;
  seed: number;
}

export interface BootstrapMarket {
  years: number;
  /** Daily simple returns to resample from. */
  returns: number[];
  /** Consecutive days drawn together, which keeps volatility clustering intact. */
  block: number;
  paths: number;
  seed: number;
}

const START = 100;

/** Geometric Brownian motion with Merton style jumps. */
export function simulatedPaths(m: SimulatedMarket): Float64Array[] {
  const n = Math.max(2, Math.round(m.years * TRADING_DAYS) + 1);
  const dt = 1 / TRADING_DAYS;
  const rand = mulberry32(m.seed);
  const normal = normalSampler(rand);
  const compensator = m.jumpsPerYear * (Math.exp(m.jumpMean + 0.5 * m.jumpVol * m.jumpVol) - 1);
  const mu = Math.log(1 + m.drift);
  const driftStep = (mu - compensator) * dt;
  const lambda = m.jumpsPerYear * dt;
  const out: Float64Array[] = [];
  for (let k = 0; k < m.paths; k++) {
    const path = new Float64Array(n);
    path[0] = START;
    for (let t = 1; t < n; t++) {
      let x = driftStep - 0.5 * m.vol * m.vol * dt + m.vol * Math.sqrt(dt) * normal();
      const jumps = poisson(rand, lambda);
      for (let j = 0; j < jumps; j++) x += m.jumpMean + m.jumpVol * normal();
      path[t] = path[t - 1] * Math.exp(x);
    }
    out.push(path);
  }
  return out;
}

/** Stationary block bootstrap of historical daily returns. */
export function bootstrapPaths(m: BootstrapMarket): Float64Array[] {
  const n = Math.max(2, Math.round(m.years * TRADING_DAYS) + 1);
  const rand = mulberry32(m.seed);
  const src = m.returns;
  const block = Math.max(1, Math.round(m.block));
  const out: Float64Array[] = [];
  for (let k = 0; k < m.paths; k++) {
    const path = new Float64Array(n);
    path[0] = START;
    let cursor = Math.floor(rand() * src.length);
    for (let t = 1; t < n; t++) {
      if ((t - 1) % block === 0) cursor = Math.floor(rand() * src.length);
      path[t] = path[t - 1] * (1 + src[cursor % src.length]);
      cursor++;
    }
    out.push(path);
  }
  return out;
}

/**
 * Implied vol proxy: trailing realized vol times a premium, floored. Options
 * usually trade rich to the vol that later shows up, which is what keeps
 * premium selling profitable on average.
 */
export function impliedVolSeries(prices: ArrayLike<number>, lookback: number, multiplier: number, floor: number): Float64Array {
  const n = prices.length;
  const out = new Float64Array(n);
  const w = Math.max(2, Math.round(lookback));
  const r = new Float64Array(n);
  for (let t = 1; t < n; t++) r[t] = Math.log(prices[t] / prices[t - 1]);
  const seedCount = Math.min(w, n - 1);
  let seed = 0.2;
  if (seedCount >= 2) {
    let s = 0;
    let s2 = 0;
    for (let t = 1; t <= seedCount; t++) {
      s += r[t];
      s2 += r[t] * r[t];
    }
    const mean = s / seedCount;
    seed = Math.sqrt(Math.max(s2 / seedCount - mean * mean, 0) * TRADING_DAYS);
  }
  let sum = 0;
  let sum2 = 0;
  for (let t = 0; t < n; t++) {
    if (t >= 1) {
      sum += r[t];
      sum2 += r[t] * r[t];
    }
    if (t - w >= 1) {
      sum -= r[t - w];
      sum2 -= r[t - w] * r[t - w];
    }
    const count = Math.min(t, w);
    let hv = seed;
    if (count >= 10) {
      const mean = sum / count;
      hv = Math.sqrt(Math.max(sum2 / count - mean * mean, 0) * TRADING_DAYS);
    }
    out[t] = Math.max(floor, hv * multiplier);
  }
  return out;
}
