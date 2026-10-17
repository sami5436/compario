export function Methodology() {
  return (
    <section className="mt-14">
      <div className="mb-3 border-t-2 border-ink pt-2">
        <p className="kicker text-accent">The fine print</p>
        <h3 className="text-2xl font-semibold leading-tight tracking-tight">How the numbers are made</h3>
      </div>
      <div className="gap-8 text-[0.95rem] leading-relaxed text-ink-soft md:columns-2 xl:columns-3 [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-ink">
        <p>
          <strong>Prices.</strong> Real history uses daily closes adjusted for splits and dividends, so buy and hold is a total return. Reshuffled markets cut
          that same history into blocks of consecutive days and stitch them together at random. Synthetic markets are geometric Brownian motion with sudden
          shocks layered on top.
        </p>
        <p>
          <strong>Option prices.</strong> Free historical option chains do not exist, so every option is priced with Black Scholes. Implied volatility is the
          trailing realized volatility times a premium you control. Options trading rich to realized vol is the whole reason selling them has paid over
          time; set the multiplier to 1 and the edge mostly disappears, which is the point. A simple skew then tilts each strike&rsquo;s vol, so out of the
          money puts cost more than the calls opposite them, the way they do on real index options.
        </p>
        <p>
          <strong>Strikes.</strong> Each cycle picks the strike nearest the chosen delta, rounded to a listed increment, away from the money. Fills are at mid
          less the spread cost, plus commission per contract.
        </p>
        <p>
          <strong>Settlement.</strong> Covered calls, collars, married puts, cash secured puts and spreads settle in cash for their intrinsic value at expiry,
          which is economically the same as being assigned and immediately restoring the position. The wheel takes real delivery: assigned shares are held
          and called away shares are gone.
        </p>
        <p>
          <strong>Cash.</strong> Idle cash and put collateral earn the cash yield every day. Leverage borrows at that same rate and pays the fund fee, rebalanced
          daily like a leveraged ETF.
        </p>
        <p>
          <strong>Statistics.</strong> Annual return is compound growth. Sharpe and Sortino use daily returns over cash, annualized. Drawdown is the fall from
          the prior peak. With many markets, every figure is the median across them.
        </p>
        <p>
          <strong>Missing on purpose.</strong> Taxes, early assignment, the finer shape of the smile, a cash yield that moves with the Fed, and the way implied vol jumps in a selloff. Each of these tends to
          flatter option selling here, so treat the income strategies&rsquo; results as a best case.
        </p>
      </div>
    </section>
  );
}
