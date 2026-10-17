import { catalog } from "@/engine/catalog";
import { defaultParams, type Metrics, type Params, type StrategyId } from "@/engine/types";

export type MarketMode = "history" | "bootstrap" | "simulated";

export interface Settings extends Params {
  mode: MarketMode;
  symbol: string;
  from: string;
  to: string;
  years: number;
  drift: number;
  vol: number;
  jumpsPerYear: number;
  jumpMean: number;
  jumpVol: number;
  paths: number;
  seed: number;
  block: number;
  strategies: StrategyId[];
  rank: keyof Metrics;
  log: boolean;
}

export function defaultSettings(): Settings {
  return {
    ...defaultParams,
    mode: "history",
    symbol: "SPY",
    from: "2015-01-02",
    /** Blank means the latest close. */
    to: "",
    years: 10,
    drift: 0.08,
    vol: 0.18,
    jumpsPerYear: 0.4,
    jumpMean: -0.1,
    jumpVol: 0.05,
    paths: 250,
    seed: 42,
    block: 20,
    strategies: ["hold", "coveredCall", "cashPut", "wheel", "collar", "trend", "cash"],
    rank: "cagr",
    log: false,
  };
}

const ALL_IDS = new Set<string>(catalog.map((s) => s.id));

/** Only settings that differ from the defaults go in the address bar. */
export function toQuery(s: Settings): string {
  const base = defaultSettings();
  const q = new URLSearchParams();
  for (const key of Object.keys(s) as (keyof Settings)[]) {
    const value = s[key];
    const fallback = base[key];
    if (key === "strategies") {
      const list = (value as StrategyId[]).join(",");
      if (list !== (fallback as StrategyId[]).join(",")) q.set(key, list);
    } else if ((key === "from" || key === "to") && s.mode === "simulated") {
      continue;
    } else if (value !== fallback) {
      q.set(key, String(value));
    }
  }
  return q.toString();
}

export function fromQuery(search: string): Settings {
  const s = defaultSettings();
  const q = new URLSearchParams(search);
  const target = s as unknown as Record<string, unknown>;
  for (const [key, raw] of q) {
    if (!(key in s)) continue;
    const current = target[key];
    if (key === "strategies") {
      s.strategies = raw.split(",").filter((id) => ALL_IDS.has(id)) as StrategyId[];
    } else if (typeof current === "number") {
      const n = Number(raw);
      if (Number.isFinite(n)) target[key] = n;
    } else if (typeof current === "boolean") {
      target[key] = raw === "true";
    } else if (typeof current === "string") {
      target[key] = raw.slice(0, 32);
    }
  }
  if (!["history", "bootstrap", "simulated"].includes(s.mode)) s.mode = "history";
  return s;
}

export function paramsOf(s: Settings): Params {
  const keys = Object.keys(defaultParams) as (keyof Params)[];
  return Object.fromEntries(keys.map((k) => [k, s[k]])) as unknown as Params;
}
