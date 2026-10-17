import { catalogById } from "@/engine/catalog";
import type { RunOutput, StrategyResult } from "@/engine/run";
import type { Metrics } from "@/engine/types";
import { pct, points } from "./format";

export const metricLabels: Record<keyof Metrics, string> = {
  cagr: "Annual return",
  totalReturn: "Total return",
  finalValue: "Ending value",
  maxDrawdown: "Worst drawdown",
  vol: "Volatility",
  sharpe: "Sharpe",
  sortino: "Sortino",
  calmar: "Calmar",
  worstMonth: "Worst month",
  bestMonth: "Best month",
};

/** Volatility is the only metric where smaller is better. Drawdowns are negative, so larger is already better. */
export function rankResults(results: StrategyResult[], key: keyof Metrics): StrategyResult[] {
  const dir = key === "vol" ? 1 : -1;
  return [...results].sort((a, b) => dir * (a.metrics[key] - b.metrics[key]));
}

const lower = (id: StrategyResult["id"]) => {
  const name = catalogById[id].name;
  return id === "hold" ? "buy and hold" : name.charAt(0).toLowerCase() + name.slice(1);
};

export interface Story {
  headline: string;
  deck: string;
}

export function tellStory(out: RunOutput, subject: string): Story {
  const years = (out.days - 1) / 252;
  const span = years >= 1.5 ? `${years.toFixed(years < 10 ? 1 : 0)} years` : `${Math.round(years * 12)} months`;
  const hold = out.results.find((r) => r.id === "hold");
  const rivals = out.results.filter((r) => r.id !== "hold");
  const multi = out.paths > 1;
  const where = multi ? `the median of ${out.paths} ${subject} markets` : `${span} of ${subject}`;

  if (!hold || rivals.length === 0) {
    return {
      headline: "Buy and hold, alone on the page",
      deck: "Add a challenger from the roster above the chart to see how it stacks up.",
    };
  }

  const byCagr = rankResults(out.results, "cagr");
  const leader = byCagr[0];
  const gap = leader.metrics.cagr - hold.metrics.cagr;

  if (leader.id === "hold") {
    const next = byCagr[1];
    const safer = next.metrics.maxDrawdown > hold.metrics.maxDrawdown;
    return {
      headline: multi ? "Owning it outright still wins the median market" : `Nothing beat simply holding ${subject}`,
      deck:
        `Across ${where}, buy and hold compounded at ${pct(hold.metrics.cagr)} a year. ` +
        `The closest challenger, ${lower(next.id)}, trailed by ${points(next.metrics.cagr - hold.metrics.cagr)} a year` +
        (safer
          ? `, though its worst fall was ${pct(-next.metrics.maxDrawdown, 0)} against ${pct(-hold.metrics.maxDrawdown, 0)}.`
          : ` and fell further at its worst.`) +
        (multi ? ` It still finished ahead in ${pct(next.beatHoldOdds, 0)} of the markets.` : ""),
    };
  }

  const calmer = leader.metrics.maxDrawdown > hold.metrics.maxDrawdown;
  const name = catalogById[leader.id].name;
  return {
    headline: `${name} beat buy and hold by ${points(gap)} a year`,
    deck:
      `In ${where}, ${lower(leader.id)} compounded at ${pct(leader.metrics.cagr)} against ${pct(hold.metrics.cagr)} for owning the shares, ` +
      (calmer
        ? `and did it with a shallower worst drawdown of ${pct(-leader.metrics.maxDrawdown, 0)} versus ${pct(-hold.metrics.maxDrawdown, 0)}.`
        : `but paid for it with a deeper worst drawdown of ${pct(-leader.metrics.maxDrawdown, 0)} versus ${pct(-hold.metrics.maxDrawdown, 0)}.`) +
      (multi ? ` It came out ahead in ${pct(leader.beatHoldOdds, 0)} of the markets.` : ""),
  };
}
