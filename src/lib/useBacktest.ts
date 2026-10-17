"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketSpec, RunOutput } from "@/engine/run";
import { dailyReturns, loadHistory, type History } from "./history";
import { paramsOf, type Settings } from "./settings";

export type Status = "idle" | "loading" | "running" | "ready" | "error";

export interface BacktestState {
  status: Status;
  output: RunOutput | null;
  history: History | null;
  error: string | null;
}

export function useBacktest(settings: Settings): BacktestState {
  const [state, setState] = useState<BacktestState>({ status: "idle", output: null, history: null, error: null });
  const worker = useRef<Worker | null>(null);
  const job = useRef(0);

  useEffect(() => {
    const w = new Worker(new URL("../engine/worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    w.onmessage = (event: MessageEvent<{ id: number; output?: RunOutput; error?: string }>) => {
      if (event.data.id !== job.current) return;
      const { output, error } = event.data;
      setState((prev) =>
        output ? { ...prev, status: "ready", output, error: null } : { ...prev, status: "error", error: error ?? "Unknown error" },
      );
    };
    return () => w.terminate();
  }, []);

  // Display only choices (chart scale, ranking) should not trigger a new run.
  const runKey = JSON.stringify({ ...settings, log: null, rank: null });

  useEffect(() => {
    const settings = JSON.parse(runKey) as Settings;
    const { symbol, from, to } = settings;
    const needsHistory = settings.mode !== "simulated";
    const id = ++job.current;
    const timer = window.setTimeout(async () => {
      let history: History | null = null;
      if (needsHistory) {
        setState((prev) => ({ ...prev, status: "loading" }));
        try {
          history = await loadHistory(symbol, from, to);
        } catch (err) {
          if (id !== job.current) return;
          setState((prev) => ({ ...prev, status: "error", error: (err as Error).message }));
          return;
        }
        if (id !== job.current) return;
      }

      let market: MarketSpec;
      if (settings.mode === "history" && history) {
        market = { kind: "history", symbol: history.symbol, dates: history.dates, prices: history.prices };
      } else if (settings.mode === "bootstrap" && history) {
        market = {
          kind: "bootstrap",
          symbol: history.symbol,
          returns: dailyReturns(history.prices),
          years: settings.years,
          block: settings.block,
          paths: settings.paths,
          seed: settings.seed,
        };
      } else {
        market = {
          kind: "simulated",
          years: settings.years,
          drift: settings.drift,
          vol: settings.vol,
          jumpsPerYear: settings.jumpsPerYear,
          jumpMean: settings.jumpMean,
          jumpVol: settings.jumpVol,
          paths: settings.paths,
          seed: settings.seed,
        };
      }
      setState((prev) => ({ ...prev, history, status: "running" }));
      worker.current?.postMessage({ id, input: { market, params: paramsOf(settings), strategies: settings.strategies } });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [runKey]);

  return state;
}
