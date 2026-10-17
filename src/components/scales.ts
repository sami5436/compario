export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}

export function logTicks(min: number, max: number): number[] {
  const lo = Math.max(min, 1e-9);
  const out: number[] = [];
  const start = Math.floor(Math.log10(lo));
  const end = Math.ceil(Math.log10(max));
  const span = Math.log10(max / lo);
  const mantissas = span < 0.8 ? [1, 1.5, 2, 3, 4, 5, 6, 8] : span < 2 ? [1, 2, 5] : [1];
  for (let e = start; e <= end; e++) for (const m of mantissas) {
    const v = m * Math.pow(10, e);
    if (v >= lo && v <= max) out.push(v);
  }
  return out.length >= 2 ? out : niceTicks(min, max, 4);
}

/** Push labels apart vertically so none overlap, keeping their order. */
export function spreadLabels(ys: number[], gap: number, top: number, bottom: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed = order.map((o) => o.y);
  for (let k = 1; k < placed.length; k++) placed[k] = Math.max(placed[k], placed[k - 1] + gap);
  const overflow = placed.length ? placed[placed.length - 1] - bottom : 0;
  if (overflow > 0) for (let k = 0; k < placed.length; k++) placed[k] -= overflow;
  for (let k = placed.length - 2; k >= 0; k--) placed[k] = Math.min(placed[k], placed[k + 1] - gap);
  for (let k = 0; k < placed.length; k++) placed[k] = Math.max(placed[k], top);
  const out = new Array<number>(ys.length);
  order.forEach((o, k) => (out[o.i] = placed[k]));
  return out;
}
