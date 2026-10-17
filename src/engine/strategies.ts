import { roundStrike, strikeForDelta, strikeStep } from "./blackScholes";
import { Book, MULTIPLIER } from "./book";
import { TRADING_DAYS } from "./math";
import type { Params, StrategyId, StrategyRun } from "./types";

type Prices = ArrayLike<number>;
type Simulator = (prices: Prices, iv: Prices, p: Params) => StrategyRun;

const MONTH = 21;

function cycleDays(p: Params): number {
  return Math.max(1, Math.round((p.dte * TRADING_DAYS) / 365));
}

/**
 * Shared daily loop. `step` runs after interest accrues and before the
 * account is marked to market at the close.
 */
function runBook(prices: Prices, iv: Prices, p: Params, step: (book: Book, t: number, last: number) => void): StrategyRun {
  const n = prices.length;
  const book = new Book(p.capital, p, prices, iv);
  const equity = new Float64Array(n);
  let exposed = 0;
  for (let t = 0; t < n; t++) {
    if (t > 0) book.accrue();
    step(book, t, n - 1);
    if (book.shares > 1e-9 || book.legs.length > 0) exposed++;
    equity[t] = book.equity(t);
  }
  return {
    equity,
    premium: book.premium,
    fees: book.fees,
    assignments: book.assignments,
    cycles: book.cycles,
    exposure: exposed / n,
  };
}

function plainRun(equity: Float64Array, exposure: number): StrategyRun {
  return { equity, premium: 0, fees: 0, assignments: 0, cycles: 0, exposure };
}

/** Expiry index for an option opened on day t, or null when too few days remain. */
function expiryFor(t: number, last: number, p: Params): number | null {
  if (last - t < 3) return null;
  return Math.min(t + cycleDays(p), last);
}

function years(expiry: number, t: number) {
  return (expiry - t) / TRADING_DAYS;
}

function callStrike(prices: Prices, iv: Prices, p: Params, t: number, expiry: number) {
  const s = prices[t];
  return roundStrike(strikeForDelta("call", s, p.callDelta, years(expiry, t), p.riskFree, iv[t]), s, "up");
}

function putStrike(prices: Prices, iv: Prices, p: Params, t: number, expiry: number, delta = p.putDelta) {
  const s = prices[t];
  return roundStrike(strikeForDelta("put", s, delta, years(expiry, t), p.riskFree, iv[t]), s, "down");
}

const hold: Simulator = (prices, iv, p) =>
  runBook(prices, iv, p, (book, t) => {
    if (t === 0) book.buyShares(book.cash, 0);
  });

const cash: Simulator = (prices, iv, p) => runBook(prices, iv, p, () => {});

const dca: Simulator = (prices, iv, p) => {
  const tranches = Math.max(1, Math.round(p.dcaMonths));
  const slice = p.capital / tranches;
  let done = 0;
  return runBook(prices, iv, p, (book, t) => {
    if (done < tranches && t % MONTH === 0) {
      done++;
      book.buyShares(done === tranches ? book.cash : Math.min(slice, book.cash), t);
    }
  });
};

/** Long above the moving average, in cash below it. Signals use the close and fill at that close. */
const trend: Simulator = (prices, iv, p) => {
  const w = Math.max(2, Math.round(p.smaWindow));
  let sum = 0;
  return runBook(prices, iv, p, (book, t) => {
    sum += prices[t];
    if (t >= w) sum -= prices[t - w];
    const ready = t >= w - 1;
    const above = !ready || prices[t] >= sum / w;
    if (above && book.shares === 0) book.buyShares(book.cash, t);
    else if (!above && book.shares > 0) book.sellShares(book.shares, t);
  });
};

/** Daily rebalanced leverage, the way a leveraged ETF compounds. */
const levered: Simulator = (prices, _iv, p) => {
  const n = prices.length;
  const equity = new Float64Array(n);
  equity[0] = p.capital;
  const borrow = ((p.leverage - 1) * p.riskFree) / TRADING_DAYS;
  const fee = p.leverageFee / TRADING_DAYS;
  for (let t = 1; t < n; t++) {
    const r = prices[t] / prices[t - 1] - 1;
    equity[t] = Math.max(0, equity[t - 1] * (1 + p.leverage * r - borrow - fee));
  }
  return plainRun(equity, 1);
};

const coveredCall: Simulator = (prices, iv, p) =>
  runBook(prices, iv, p, (book, t, last) => {
    if (t === 0) book.buyShares(book.cash, 0);
    for (const leg of book.expiring(t)) book.cashSettle(leg, t);
    book.coverCash(t);
    book.takeProfits(t);
    if (book.legs.length > 0) return;
    const expiry = expiryFor(t, last, p);
    if (expiry === null) return;
    if (p.reinvestPremium && book.cash > 0) book.buyShares(book.cash, t);
    const contracts = book.sizeContracts(book.shares / MULTIPLIER);
    if (contracts > 0 && book.open("call", callStrike(prices, iv, p, t, expiry), expiry, -contracts, t)) book.cycles++;
  });

const cashPut: Simulator = (prices, iv, p) =>
  runBook(prices, iv, p, (book, t, last) => {
    for (const leg of book.expiring(t)) book.cashSettle(leg, t);
    book.takeProfits(t);
    if (book.legs.length > 0) return;
    const expiry = expiryFor(t, last, p);
    if (expiry === null) return;
    const k = putStrike(prices, iv, p, t, expiry);
    const contracts = book.sizeContracts(book.cash / (k * MULTIPLIER));
    if (contracts > 0 && book.open("put", k, expiry, -contracts, t)) book.cycles++;
  });

/** Sell puts until assigned, then sell calls on the shares until they are called away. */
const wheel: Simulator = (prices, iv, p) => {
  let basis = 0;
  return runBook(prices, iv, p, (book, t, last) => {
    const s = prices[t];
    for (const leg of book.expiring(t)) {
      const qty = -leg.contracts * MULTIPLIER;
      book.legs = book.legs.filter((l) => l !== leg);
      if (leg.kind === "put" && s < leg.strike) {
        book.shares += qty;
        book.cash -= leg.strike * qty;
        basis = leg.strike;
        book.assignments++;
      } else if (leg.kind === "call" && s > leg.strike) {
        const delivered = Math.min(qty, book.shares);
        book.shares -= delivered;
        book.cash += leg.strike * delivered;
        if (book.shares < 1e-6) book.shares = 0;
        book.assignments++;
      }
    }
    book.takeProfits(t);
    if (book.legs.length > 0) return;
    const expiry = expiryFor(t, last, p);
    if (expiry === null) return;
    if (book.shares === 0) {
      const k = putStrike(prices, iv, p, t, expiry);
      const contracts = book.sizeContracts(book.cash / (k * MULTIPLIER));
      if (contracts > 0 && book.open("put", k, expiry, -contracts, t)) book.cycles++;
    } else {
      let k = callStrike(prices, iv, p, t, expiry);
      if (p.wheelCallAboveBasis) k = Math.max(k, roundStrike(basis, s, "up"));
      const contracts = book.sizeContracts(book.shares / MULTIPLIER);
      if (contracts > 0 && book.open("call", k, expiry, -contracts, t)) book.cycles++;
    }
  });
};

function hedged(withCall: boolean): Simulator {
  return (prices, iv, p) =>
    runBook(prices, iv, p, (book, t, last) => {
      if (t === 0) book.buyShares(book.cash, 0);
      for (const leg of book.expiring(t)) book.cashSettle(leg, t);
      book.coverCash(t);
      if (book.legs.length > 0) return;
      const expiry = expiryFor(t, last, p);
      if (expiry === null) return;
      if (p.reinvestPremium && book.cash > 0) book.buyShares(book.cash, t);
      const contracts = book.sizeContracts(book.shares / MULTIPLIER);
      if (contracts <= 0) return;
      book.open("put", putStrike(prices, iv, p, t, expiry, p.hedgePutDelta), expiry, contracts, t);
      if (withCall) book.open("call", callStrike(prices, iv, p, t, expiry), expiry, -contracts, t);
      book.coverCash(t);
      book.cycles++;
    });
}

/** Bull put credit spread, sized so the worst case loss is a set share of cash. */
const putSpread: Simulator = (prices, iv, p) =>
  runBook(prices, iv, p, (book, t, last) => {
    for (const leg of book.expiring(t)) book.cashSettle(leg, t);
    if (book.legs.length === 2 && p.profitTake > 0) {
      const credit = book.legs.reduce((a, l) => a - l.entry * l.contracts, 0);
      const toClose = book.legs.reduce((a, l) => a - book.legValue(l, t) * l.contracts, 0);
      if (credit > 0 && toClose <= credit * (1 - p.profitTake)) for (const leg of [...book.legs]) book.close(leg, t);
    }
    if (book.legs.length > 0) return;
    const expiry = expiryFor(t, last, p);
    if (expiry === null) return;
    const s = prices[t];
    const short = putStrike(prices, iv, p, t, expiry);
    let long = roundStrike(short * (1 - p.spreadWidth), s, "down");
    if (long >= short) long = short - strikeStep(s);
    if (long <= 0) return;
    const contracts = book.sizeContracts((book.cash * p.spreadRisk) / ((short - long) * MULTIPLIER));
    if (contracts <= 0) return;
    book.open("put", short, expiry, -contracts, t);
    book.open("put", long, expiry, contracts, t);
    book.cycles++;
  });

export const simulators: Record<StrategyId, Simulator> = {
  hold,
  dca,
  trend,
  levered,
  coveredCall,
  cashPut,
  wheel,
  collar: hedged(true),
  marriedPut: hedged(false),
  putSpread,
  cash,
};
