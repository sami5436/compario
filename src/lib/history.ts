export interface History {
  symbol: string;
  name: string;
  currency: string;
  dates: string[];
  prices: number[];
}

const memo = new Map<string, Promise<History>>();

export function loadHistory(symbol: string, from: string, to: string): Promise<History> {
  const key = `${symbol.toUpperCase()}|${from}|${to}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const job = fetch(`/api/prices?${new URLSearchParams({ symbol, from, to })}`).then(async (res) => {
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Could not load prices.");
    return body as History;
  });
  job.catch(() => memo.delete(key));
  memo.set(key, job);
  return job;
}

export function dailyReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) out.push(prices[i] / prices[i - 1] - 1);
  return out;
}
