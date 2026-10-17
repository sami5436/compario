import { bsPrice, type OptionKind } from "./blackScholes";
import { TRADING_DAYS } from "./math";
import type { Params } from "./types";

export const MULTIPLIER = 100;

export interface OptionLeg {
  kind: OptionKind;
  strike: number;
  /** Index of the trading day the option settles on. */
  expiry: number;
  /** Signed contract count: negative is short. */
  contracts: number;
  /** Price per share paid or received when the leg was opened. */
  entry: number;
}

/**
 * A brokerage account for one strategy on one price path. Every strategy
 * trades through this so fills, fees and settlement are treated identically.
 */
export class Book {
  cash: number;
  shares = 0;
  legs: OptionLeg[] = [];
  premium = 0;
  fees = 0;
  assignments = 0;
  cycles = 0;

  constructor(
    capital: number,
    private readonly p: Params,
    private readonly prices: ArrayLike<number>,
    private readonly iv: ArrayLike<number>,
  ) {
    this.cash = capital;
  }

  accrue() {
    if (this.cash > 0) this.cash *= 1 + this.p.riskFree / TRADING_DAYS;
  }

  legValue(leg: OptionLeg, t: number): number {
    const remaining = Math.max(leg.expiry - t, 0) / TRADING_DAYS;
    return bsPrice(leg.kind, this.prices[t], leg.strike, remaining, this.p.riskFree, this.iv[t]);
  }

  equity(t: number): number {
    let v = this.cash + this.shares * this.prices[t];
    for (const leg of this.legs) v += this.legValue(leg, t) * leg.contracts * MULTIPLIER;
    return v;
  }

  sizeContracts(raw: number): number {
    if (!(raw > 0)) return 0;
    return this.p.wholeContracts ? Math.floor(raw + 1e-9) : raw;
  }

  buyShares(amount: number, t: number) {
    if (amount <= 0) return;
    this.shares += amount / this.prices[t];
    this.cash -= amount;
  }

  sellShares(count: number, t: number) {
    const n = Math.min(count, this.shares);
    if (n <= 0) return;
    this.shares -= n;
    this.cash += n * this.prices[t];
  }

  /** Sell stock if needed so cash never stays negative. */
  coverCash(t: number) {
    if (this.cash < 0 && this.shares > 0) this.sellShares(-this.cash / this.prices[t], t);
  }

  open(kind: OptionKind, strike: number, expiry: number, contracts: number, t: number): OptionLeg | null {
    if (contracts === 0) return null;
    const leg: OptionLeg = { kind, strike, expiry, contracts, entry: 0 };
    const mid = this.legValue(leg, t);
    const fill = contracts < 0 ? mid * (1 - this.p.slippage) : mid * (1 + this.p.slippage);
    leg.entry = fill;
    const flow = -fill * contracts * MULTIPLIER;
    const fee = this.p.commissionPerContract * Math.abs(contracts);
    this.cash += flow - fee;
    this.premium += flow;
    this.fees += fee;
    this.legs.push(leg);
    return leg;
  }

  close(leg: OptionLeg, t: number) {
    const mid = this.legValue(leg, t);
    const fill = leg.contracts < 0 ? mid * (1 + this.p.slippage) : mid * (1 - this.p.slippage);
    const flow = fill * leg.contracts * MULTIPLIER;
    const fee = this.p.commissionPerContract * Math.abs(leg.contracts);
    this.cash += flow - fee;
    this.premium += flow;
    this.fees += fee;
    this.legs = this.legs.filter((l) => l !== leg);
  }

  /** Settle a leg for its intrinsic value in cash. */
  cashSettle(leg: OptionLeg, t: number): boolean {
    const s = this.prices[t];
    const intrinsic = leg.kind === "call" ? Math.max(s - leg.strike, 0) : Math.max(leg.strike - s, 0);
    this.cash += intrinsic * leg.contracts * MULTIPLIER;
    this.legs = this.legs.filter((l) => l !== leg);
    if (intrinsic > 0 && leg.contracts < 0) this.assignments++;
    return intrinsic > 0;
  }

  expiring(t: number): OptionLeg[] {
    return this.legs.filter((l) => l.expiry <= t);
  }

  /** Buy back short legs that have already captured the target share of their premium. */
  takeProfits(t: number): boolean {
    const target = this.p.profitTake;
    if (target <= 0) return false;
    let closed = false;
    for (const leg of [...this.legs]) {
      if (leg.contracts >= 0 || leg.expiry <= t) continue;
      if (this.legValue(leg, t) <= leg.entry * (1 - target)) {
        this.close(leg, t);
        closed = true;
      }
    }
    return closed;
  }
}
