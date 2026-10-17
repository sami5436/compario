import type { StrategyId } from "./types";

export interface StrategyInfo {
  id: StrategyId;
  name: string;
  short: string;
  family: "Stock" | "Income" | "Hedged" | "Baseline";
  summary: string;
}

export const catalog: StrategyInfo[] = [
  {
    id: "hold",
    name: "Buy and hold",
    short: "Hold",
    family: "Stock",
    summary: "Buy on day one and never touch it. The benchmark every clever idea has to beat.",
  },
  {
    id: "coveredCall",
    name: "Covered calls",
    short: "Calls",
    family: "Income",
    summary: "Own the shares and sell an out of the money call each cycle. Rallies past the strike are given up for steady premium.",
  },
  {
    id: "cashPut",
    name: "Cash secured puts",
    short: "Puts",
    family: "Income",
    summary: "Hold cash and sell puts against it. Losses are paid in cash when the stock closes below the strike.",
  },
  {
    id: "wheel",
    name: "The wheel",
    short: "Wheel",
    family: "Income",
    summary: "Sell puts until assigned, then sell calls on the shares until they are called away, then start over.",
  },
  {
    id: "putSpread",
    name: "Bull put spread",
    short: "Spread",
    family: "Income",
    summary: "Sell a put and buy a cheaper one below it. Smaller premium, but the worst case is known in advance.",
  },
  {
    id: "collar",
    name: "Collar",
    short: "Collar",
    family: "Hedged",
    summary: "Own the shares, buy a protective put, and pay for it by selling a call. A corridor around the price.",
  },
  {
    id: "marriedPut",
    name: "Married put",
    short: "Insured",
    family: "Hedged",
    summary: "Own the shares and keep buying downside insurance. Crashes hurt less; quiet years cost the premium.",
  },
  {
    id: "dca",
    name: "Dollar cost averaging",
    short: "DCA",
    family: "Stock",
    summary: "Feed the capital in over a number of months instead of all at once, earning interest on the rest.",
  },
  {
    id: "trend",
    name: "Trend following",
    short: "Trend",
    family: "Stock",
    summary: "Own the stock while it trades above its moving average and sit in cash when it falls below.",
  },
  {
    id: "levered",
    name: "Daily leverage",
    short: "Levered",
    family: "Stock",
    summary: "A leveraged fund rebalanced every day, with borrowing cost and fees. Volatility decay included.",
  },
  {
    id: "cash",
    name: "Treasury bills",
    short: "Cash",
    family: "Baseline",
    summary: "Every dollar earns the risk free rate. The floor any risky strategy should clear.",
  },
];

export const catalogById = Object.fromEntries(catalog.map((s) => [s.id, s])) as Record<StrategyId, StrategyInfo>;
