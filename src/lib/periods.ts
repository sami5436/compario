export const POPULAR_TICKERS = ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "KO", "IWM"];

/** Only call from event handlers: reading the clock during render breaks prerendering. */
export function yearsAgo(n: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}

const latest = () => "";

export interface Era {
  label: string;
  from: () => string;
  to: () => string;
}

export const ERAS: Era[] = [
  { label: "5 years", from: () => yearsAgo(5), to: latest },
  { label: "10 years", from: () => yearsAgo(10), to: latest },
  { label: "20 years", from: () => yearsAgo(20), to: latest },
  { label: "Financial crisis", from: () => "2007-10-01", to: () => "2011-12-31" },
  { label: "Lost decade", from: () => "2000-01-01", to: () => "2010-12-31" },
  { label: "Pandemic", from: () => "2020-01-01", to: () => "2021-12-31" },
  { label: "2022 bear", from: () => "2022-01-01", to: () => "2023-06-30" },
];
