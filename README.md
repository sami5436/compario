# Compario

Eleven ways to own a stock, tested side by side on the same tape.

Compario replays buy and hold, covered calls, cash secured puts, the wheel, bull put spreads, collars, married puts, dollar cost averaging, trend following, daily leverage and Treasury bills against either real price history or thousands of simulated markets, then ranks them on return, drawdown, Sharpe, Sortino and more.

## Markets

* **History** plays back actual daily closes (adjusted for splits and dividends) for any ticker.
* **Reshuffled** block bootstraps a ticker's real daily returns into many alternate futures.
* **Synthetic** runs geometric Brownian motion with sudden shocks, using drift, volatility and crash settings you choose.

## How options are priced

Free historical option chains do not exist, so every option is priced with Black Scholes. Implied vol is trailing realized vol times a premium you set, tilted by a simple skew so downside puts cost more than upside calls. Fills lose a share of the mid price to the spread, and commissions are charged per contract. The fine print section on the site lists what the model leaves out.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # engine tests
npm run check   # types, lint, tests and the long dash check
```

The engine lives in `src/engine` and runs in a Web Worker, so even a thousand market Monte Carlo keeps the page responsive. Prices come from `src/app/api/prices`, a small route that proxies Yahoo's daily chart endpoint and caches the result.

Settings live in the address bar, so any run can be shared as a link.

Built with Next.js, React and TypeScript. Not investment advice.
