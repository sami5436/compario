export type StrategyId =
  | "hold"
  | "dca"
  | "trend"
  | "levered"
  | "coveredCall"
  | "cashPut"
  | "wheel"
  | "collar"
  | "marriedPut"
  | "putSpread"
  | "cash";

export interface Params {
  capital: number;
  /** Annual risk free rate earned on idle cash, as a decimal. */
  riskFree: number;
  commissionPerContract: number;
  /** Fraction of the mid price lost to the spread on every option fill. */
  slippage: number;
  /** Implied vol is modelled as trailing realized vol times this multiplier. */
  ivMultiplier: number;
  ivFloor: number;
  volLookback: number;
  /** Calendar days to expiration for each option cycle. */
  dte: number;
  callDelta: number;
  putDelta: number;
  /** Close a short option once this share of its premium is captured. Zero holds to expiry. */
  profitTake: number;
  wholeContracts: boolean;
  reinvestPremium: boolean;
  wheelCallAboveBasis: boolean;
  smaWindow: number;
  leverage: number;
  leverageFee: number;
  dcaMonths: number;
  hedgePutDelta: number;
  spreadWidth: number;
  spreadRisk: number;
}

export interface StrategyRun {
  equity: Float64Array;
  premium: number;
  fees: number;
  assignments: number;
  cycles: number;
  /** Share of days with stock exposure. */
  exposure: number;
}

export interface Metrics {
  finalValue: number;
  totalReturn: number;
  cagr: number;
  vol: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  calmar: number;
  worstMonth: number;
  bestMonth: number;
}

export const defaultParams: Params = {
  capital: 100_000,
  riskFree: 0.04,
  commissionPerContract: 0.65,
  slippage: 0.03,
  ivMultiplier: 1.15,
  ivFloor: 0.1,
  volLookback: 30,
  dte: 30,
  callDelta: 0.3,
  putDelta: 0.3,
  profitTake: 0,
  wholeContracts: false,
  reinvestPremium: true,
  wheelCallAboveBasis: true,
  smaWindow: 200,
  leverage: 2,
  leverageFee: 0.0095,
  dcaMonths: 12,
  hedgePutDelta: 0.2,
  spreadWidth: 0.05,
  spreadRisk: 0.25,
};
