export function pct(x: number, digits = 1): string {
  if (!Number.isFinite(x)) return "n/a";
  const v = (Math.abs(x) * 100).toFixed(digits);
  return x < 0 && Number(v) !== 0 ? `\u2212${v}%` : `${v}%`;
}

/** Signed percent using a true minus sign, which reads better in tables than a hyphen. */
export function signedPct(x: number, digits = 1): string {
  if (!Number.isFinite(x)) return "n/a";
  const v = (x * 100).toFixed(digits);
  if (Number(v) === 0) return `${(0).toFixed(digits)}%`;
  return x > 0 ? `+${v}%` : `−${v.slice(1)}%`;
}

export function points(x: number, digits = 1): string {
  return `${Math.abs(x * 100).toFixed(digits)} ${Math.abs(x * 100).toFixed(digits) === (1).toFixed(digits) ? "point" : "points"}`;
}

export function money(x: number, compact = true): string {
  if (!Number.isFinite(x)) return "n/a";
  const sign = x < 0 ? "−" : "";
  const v = Math.abs(x);
  if (compact && v >= 1e9) return `${sign}$${(v / 1e9).toFixed(2)}B`;
  if (compact && v >= 1e6) return `${sign}$${(v / 1e6).toFixed(2)}M`;
  if (compact && v >= 1e4) return `${sign}$${(v / 1e3).toFixed(0)}k`;
  return `${sign}$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function ratio(x: number): string {
  return Number.isFinite(x) ? (x < 0 ? `−${Math.abs(x).toFixed(2)}` : x.toFixed(2)) : "n/a";
}

export function longDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
