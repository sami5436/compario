import { normCdf, normInv } from "./math";

export type OptionKind = "call" | "put";

/** Black Scholes value of a European option on a non dividend paying asset. */
export function bsPrice(kind: OptionKind, s: number, k: number, t: number, r: number, vol: number): number {
  if (t <= 0) return kind === "call" ? Math.max(s - k, 0) : Math.max(k - s, 0);
  const sigma = Math.max(vol, 1e-4);
  const sq = sigma * Math.sqrt(t);
  const d1 = (Math.log(s / k) + (r + 0.5 * sigma * sigma) * t) / sq;
  const d2 = d1 - sq;
  const disc = Math.exp(-r * t);
  return kind === "call"
    ? s * normCdf(d1) - k * disc * normCdf(d2)
    : k * disc * normCdf(-d2) - s * normCdf(-d1);
}

export function bsDelta(kind: OptionKind, s: number, k: number, t: number, r: number, vol: number): number {
  if (t <= 0) {
    if (kind === "call") return s > k ? 1 : 0;
    return s < k ? -1 : 0;
  }
  const sigma = Math.max(vol, 1e-4);
  const d1 = (Math.log(s / k) + (r + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t));
  return kind === "call" ? normCdf(d1) : normCdf(d1) - 1;
}

/**
 * Strike whose delta equals the target. `absDelta` is unsigned, so 0.30 means
 * a 30 delta call or a minus 30 delta put.
 */
export function strikeForDelta(kind: OptionKind, s: number, absDelta: number, t: number, r: number, vol: number): number {
  const sigma = Math.max(vol, 1e-4);
  const target = Math.min(Math.max(absDelta, 0.01), 0.99);
  const d1 = kind === "call" ? normInv(target) : normInv(1 - target);
  return s * Math.exp(-d1 * sigma * Math.sqrt(t) + (r + 0.5 * sigma * sigma) * t);
}

/** Listed strikes come in increments that grow with the share price. */
export function strikeStep(s: number): number {
  if (s < 25) return 0.5;
  if (s < 200) return 1;
  if (s < 1000) return 5;
  return 10;
}

export function roundStrike(k: number, s: number, direction: "up" | "down"): number {
  const step = strikeStep(s);
  const units = direction === "up" ? Math.ceil(k / step - 1e-9) : Math.floor(k / step + 1e-9);
  return Math.max(step, units * step);
}
