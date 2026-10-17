import { TRADING_DAYS } from "./math";
import type { Metrics } from "./types";

const MONTH = 21;

export function drawdownSeries(equity: ArrayLike<number>): Float64Array {
  const out = new Float64Array(equity.length);
  let peak = -Infinity;
  for (let t = 0; t < equity.length; t++) {
    peak = Math.max(peak, equity[t]);
    out[t] = peak > 0 ? equity[t] / peak - 1 : 0;
  }
  return out;
}

export function computeMetrics(equity: ArrayLike<number>, riskFree: number): Metrics {
  const n = equity.length;
  const start = equity[0];
  const end = equity[n - 1];
  const yrs = Math.max((n - 1) / TRADING_DAYS, 1 / TRADING_DAYS);
  const totalReturn = end / start - 1;
  const cagr = end > 0 ? Math.pow(end / start, 1 / yrs) - 1 : -1;

  const rfDaily = riskFree / TRADING_DAYS;
  let sum = 0;
  let sum2 = 0;
  let down2 = 0;
  let count = 0;
  for (let t = 1; t < n; t++) {
    const prev = equity[t - 1];
    if (prev <= 0) continue;
    const ex = equity[t] / prev - 1 - rfDaily;
    sum += ex;
    sum2 += ex * ex;
    if (ex < 0) down2 += ex * ex;
    count++;
  }
  const mean = count ? sum / count : 0;
  const variance = count > 1 ? Math.max(sum2 / count - mean * mean, 0) : 0;
  const vol = Math.sqrt(variance * TRADING_DAYS);
  const downside = count ? Math.sqrt((down2 / count) * TRADING_DAYS) : 0;
  const annualExcess = mean * TRADING_DAYS;

  let maxDrawdown = 0;
  let peak = -Infinity;
  for (let t = 0; t < n; t++) {
    peak = Math.max(peak, equity[t]);
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, equity[t] / peak - 1);
  }

  let worstMonth = 0;
  let bestMonth = 0;
  for (let t = MONTH; t < n; t += MONTH) {
    if (equity[t - MONTH] <= 0) continue;
    const r = equity[t] / equity[t - MONTH] - 1;
    worstMonth = Math.min(worstMonth, r);
    bestMonth = Math.max(bestMonth, r);
  }

  return {
    finalValue: end,
    totalReturn,
    cagr,
    vol,
    sharpe: vol > 1e-9 ? annualExcess / vol : 0,
    sortino: downside > 1e-9 ? annualExcess / downside : 0,
    maxDrawdown,
    calmar: maxDrawdown < -1e-9 ? cagr / -maxDrawdown : 0,
    worstMonth,
    bestMonth,
  };
}
