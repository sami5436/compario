import type { NextRequest } from "next/server";

const SYMBOL = /^[A-Za-z0-9.^=-]{1,15}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

interface YahooChart {
  chart: {
    result?: {
      meta: { symbol: string; longName?: string; shortName?: string; currency?: string };
      timestamp?: number[];
      indicators: {
        quote: { close: (number | null)[] }[];
        adjclose?: { adjclose: (number | null)[] }[];
      };
    }[];
    error?: { description?: string } | null;
  };
}

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (!SYMBOL.test(symbol)) return fail("That does not look like a ticker symbol.", 400);
  if (!DATE.test(from) || !DATE.test(to)) return fail("Dates must look like 2015-01-31.", 400);

  const start = Math.floor(Date.parse(`${from}T00:00:00Z`) / 1000);
  const end = Math.floor(Date.parse(`${to}T23:59:59Z`) / 1000);
  if (!(end > start)) return fail("The end date has to come after the start date.", 400);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${start}&period2=${end}&interval=1d&events=div%2Csplit`;
  let body: YahooChart;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Compario/1.0)" },
      next: { revalidate: 60 * 60 * 12 },
    });
    if (res.status === 404) return fail(`No price history found for ${symbol}.`, 404);
    if (!res.ok) return fail("The price source is not responding right now. Try a simulated market.", 502);
    body = (await res.json()) as YahooChart;
  } catch {
    return fail("The price source is not responding right now. Try a simulated market.", 502);
  }

  const result = body.chart.result?.[0];
  if (!result?.timestamp?.length) return fail(`No price history found for ${symbol} in that window.`, 404);

  const closes = result.indicators.quote[0]?.close ?? [];
  const adjusted = result.indicators.adjclose?.[0]?.adjclose ?? closes;
  const dates: string[] = [];
  const prices: number[] = [];
  result.timestamp.forEach((ts, i) => {
    const px = adjusted[i] ?? closes[i];
    if (px == null || !(px > 0)) return;
    dates.push(new Date(ts * 1000).toISOString().slice(0, 10));
    prices.push(Number(px.toFixed(4)));
  });
  if (prices.length < 30) return fail("That window is too short. Pick at least a couple of months.", 422);

  return Response.json(
    {
      symbol: result.meta.symbol,
      name: result.meta.longName ?? result.meta.shortName ?? result.meta.symbol,
      currency: result.meta.currency ?? "USD",
      dates,
      prices,
    },
    { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } },
  );
}
