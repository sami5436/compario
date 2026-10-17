import type { StrategyId } from "@/engine/types";

export interface StrategyGuide {
  id: StrategyId;
  tagline: string;
  how: string;
  why: string;
  catch: string;
  shines: string;
  struggles: string;
  dials: string[];
}

export const strategyGuides: StrategyGuide[] = [
  {
    id: "hold",
    tagline: "The bar everything else has to clear.",
    how: "Spend the whole account on shares on the first day and never trade again. Dividends are folded into the price, so this is the full total return of owning the stock.",
    why: "It is the cheapest, simplest and most tax friendly way to own a stock. Any strategy that asks for more work, more fees and more decisions should earn more than this, or take less risk getting there.",
    catch: "You ride every crash all the way down. A 34% drawdown on paper is easy to read and much harder to sit through.",
    shines: "Long, steady bull markets, where every other strategy either caps the upside or spends time out of the market.",
    struggles: "Deep, slow bear markets like 2000 to 2002 or 2008, when it simply takes the full loss.",
    dials: ["None. That is the point."],
  },
  {
    id: "coveredCall",
    tagline: "Rent out the upside for steady premium.",
    how: "Own the shares and, every cycle, sell a call option above the current price. If the stock stays below that strike, the premium is pure extra return. If it rallies past the strike, the gains above it go to the buyer of the call. Compario then restores the position and sells the next call.",
    why: "It turns a stock into an income stream. Premium arrives every month whether the market moves or not, and it softens small declines.",
    catch: "You keep all of the downside but give away the best part of the upside. Markets often make their biggest gains in a few sharp rallies, and those are exactly the moves a covered call hands away.",
    shines: "Flat or gently rising markets, and choppy sideways years.",
    struggles: "V shaped recoveries and runaway rallies. After a crash, the rebound gets capped while the crash itself was taken in full.",
    dials: ["Call delta: lower sells further out, collecting less but keeping more upside.", "Days to expiry", "Take profit at", "Reinvest premium", "Volatility skew: upside calls are usually cheaper than at the money options."],
  },
  {
    id: "cashPut",
    tagline: "Get paid to wait for a lower price.",
    how: "Keep the account in cash and sell put options below the current price, with enough cash set aside to buy the shares if needed. If the stock stays above the strike, the premium is kept. If it falls below, the loss is paid from the cash. Compario settles that loss and sells the next put rather than holding the shares.",
    why: "The cash keeps earning interest while the puts add premium on top. Because downside puts tend to be priced richly, put selling has historically been one of the more reliable ways to earn the volatility risk premium.",
    catch: "The payoff is lopsided. You earn a small, capped premium in good months and take a large loss in a crash. Many small wins can be erased by one bad month.",
    shines: "Flat, mildly rising or slowly falling markets, especially after volatility has spiked and premiums are rich.",
    struggles: "Sudden crashes, and strong bull markets where the stock runs away while you only collect premium.",
    dials: ["Put delta: higher sells closer to the money for more premium and more risk.", "Cash yield, which is a large part of this strategy's return", "Implied over realized", "Volatility skew"],
  },
  {
    id: "wheel",
    tagline: "Puts until assigned, calls until called away, repeat.",
    how: "Start by selling cash secured puts. When a put finishes in the money, you actually take delivery of the shares. Then sell covered calls on those shares until they are called away, and go back to selling puts. Unlike the other income strategies, Compario runs the wheel with real share delivery.",
    why: "It is popular because it feels like it can never lose: you either collect premium or buy shares you wanted anyway at a discount, then sell them at a profit.",
    catch: "Assignment happens after the stock has already fallen, so you often end up holding shares through the rest of a decline. And when the stock finally rips higher, it gets called away and you are back in cash, missing the recovery.",
    shines: "Range bound stocks that oscillate around a level.",
    struggles: "Long trends in either direction. Down trends leave you holding losing shares; up trends leave you in cash.",
    dials: ["Put delta and call delta", "Wheel calls above cost basis: refuses to sell a call that would lock in a loss, which can leave shares uncovered for a long time.", "Days to expiry", "Take profit at"],
  },
  {
    id: "putSpread",
    tagline: "Sell a put, buy a cheaper one below it.",
    how: "Each cycle, sell a put and buy another put a set distance further below. The bought put caps the worst case, so the most you can lose per cycle is the gap between the strikes. Compario sizes the trade so that worst case is a fixed share of the account.",
    why: "It keeps the income flavour of put selling but with a hard floor on losses and far less capital tied up.",
    catch: "The protection costs money, so the net premium is much smaller. A run of losing cycles each takes the full defined loss, and with aggressive sizing that adds up fast.",
    shines: "Steady markets where the short put expires worthless most months.",
    struggles: "Repeated sharp drops, and markets that hover right around the short strike.",
    dials: ["Put delta", "Spread width", "Spread capital at risk: the single biggest lever on both return and drawdown.", "Take profit at"],
  },
  {
    id: "collar",
    tagline: "A corridor around the price.",
    how: "Own the shares, buy a protective put below the price, and pay for it by selling a call above the price. Losses below the put strike are covered; gains above the call strike are given away. Both are reset every cycle.",
    why: "It is what people do when they want to stay invested but cannot afford a big loss, for example a concentrated stock position or money needed soon.",
    catch: "You give up a large share of the upside for the protection. In rising markets a collar can trail buy and hold badly year after year.",
    shines: "Sharp crashes, where the put pays off while holding loses heavily.",
    struggles: "Long bull markets. The call caps every rally and the put is usually wasted.",
    dials: ["Hedge put delta", "Call delta", "Days to expiry", "Volatility skew: makes the protective put dearer and the call cheaper, so collars cost more."],
  },
  {
    id: "marriedPut",
    tagline: "Own the stock and keep buying insurance.",
    how: "Hold the shares and, every cycle, buy a put below the current price. If the stock collapses, the put pays out; if not, it expires and the premium is gone.",
    why: "It keeps every bit of upside while putting a floor under each cycle's losses.",
    catch: "Insurance is expensive, and you pay for it every month. Over a calm decade, the premiums add up to a steep drag on returns.",
    shines: "Crashes, especially sudden ones that happen within a single cycle.",
    struggles: "Calm, rising markets, which is most of the time.",
    dials: ["Hedge put delta: further out is cheaper but kicks in later.", "Days to expiry", "Implied over realized", "Volatility skew"],
  },
  {
    id: "dca",
    tagline: "Ease in instead of going all in.",
    how: "Split the account into equal slices and invest one slice each month over the averaging period. The money waiting to be invested earns the cash yield.",
    why: "It reduces the regret of investing everything right before a crash, and it is how most people invest out of a paycheck anyway.",
    catch: "Markets rise more often than they fall, so on average keeping money on the sidelines costs return. Averaging in mainly buys peace of mind.",
    shines: "Starting right before a decline.",
    struggles: "Starting right before a rally, which is the more common case.",
    dials: ["Averaging period", "Cash yield"],
  },
  {
    id: "trend",
    tagline: "In above the moving average, out below it.",
    how: "Own the stock while its price is above its moving average and move to cash when it closes below. The cash earns interest while waiting.",
    why: "Big crashes tend to unfold over months, and a trend rule can step aside for much of the damage. The goal is a smaller worst case, not a bigger return.",
    catch: "Whipsaws. In choppy markets it sells after dips and buys back after rebounds, locking in small losses over and over, and it is often out of the market during the fast recoveries.",
    shines: "Long, grinding bear markets like 2008.",
    struggles: "Sharp V shaped crashes like 2020, where it sells near the bottom and buys back higher, and sideways chop.",
    dials: ["Moving average length: shorter reacts faster but whipsaws more.", "Cash yield"],
  },
  {
    id: "levered",
    tagline: "Twice the stock does not mean twice the return.",
    how: "Hold a fund that targets a multiple of the stock's daily move, rebalanced every day, paying borrowing costs and a fund fee. This is how leveraged ETFs actually work.",
    why: "It promises amplified returns without margin calls, and in strong steady markets it delivers.",
    catch: "Volatility decay. Because leverage resets daily, a choppy market erodes the fund even if the stock ends flat. A 50% drop followed by a 50% rise leaves the stock down 25% and a 2x fund down far more.",
    shines: "Strong, calm, persistent uptrends.",
    struggles: "Volatile or sideways markets, and any deep crash, which can come close to wiping it out.",
    dials: ["Leverage", "Leveraged fund fee", "Cash yield, which sets the borrowing cost"],
  },
  {
    id: "cash",
    tagline: "The floor any risky strategy should clear.",
    how: "Every dollar sits in Treasury bills and earns the cash yield. Nothing else happens.",
    why: "If a strategy cannot beat risk free cash after all its fees and stress, the risk was not worth taking. It also anchors the Sharpe and Sortino ratios.",
    catch: "Inflation slowly eats it, and over long periods stocks have beaten it by a wide margin.",
    shines: "Bear markets and high rate eras.",
    struggles: "Every long bull market.",
    dials: ["Cash yield"],
  },
];

export const glossary: { term: string; meaning: string }[] = [
  { term: "Annual return", meaning: "Compound growth per year, the rate that turns the starting capital into the ending value. The fairest single number for comparing growth." },
  { term: "Total return", meaning: "How much the account grew over the whole period, start to finish." },
  { term: "Worst drawdown", meaning: "The biggest fall from a previous high to a later low. This is the pain you would have had to sit through." },
  { term: "Volatility", meaning: "How much the account swings day to day, annualized. Lower means a smoother ride." },
  { term: "Sharpe", meaning: "Return above cash divided by volatility. Higher means more reward for each unit of bumpiness." },
  { term: "Sortino", meaning: "Like Sharpe, but it only counts downside swings, since nobody minds sudden gains." },
  { term: "Worst month", meaning: "The worst single month of the run." },
  { term: "Beat hold", meaning: "In many market mode, the share of markets where the strategy finished ahead of buy and hold." },
  { term: "Odds of loss", meaning: "In many market mode, the share of markets where the strategy ended below where it started." },
  { term: "Net premium", meaning: "Option premium collected minus option premium paid. It does not include losses from options finishing in the money, which is why a big number here can still go with a weak result." },
  { term: "Assigned", meaning: "How many option cycles finished in the money against you, out of the total number of cycles." },
];
