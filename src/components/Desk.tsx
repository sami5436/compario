"use client";

import { useState } from "react";
import type { MarketMode, Settings } from "@/lib/settings";
import { NumberField, Section, Segmented, Toggle } from "./fields";

type Patch = (p: Partial<Settings>) => void;

const TICKERS = ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "KO", "IWM"];

function yearsAgo(n: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}
const latest = () => "";

const ERAS: { label: string; from: () => string; to: () => string }[] = [
  { label: "5 years", from: () => yearsAgo(5), to: latest },
  { label: "10 years", from: () => yearsAgo(10), to: latest },
  { label: "20 years", from: () => yearsAgo(20), to: latest },
  { label: "Financial crisis", from: () => "2007-10-01", to: () => "2011-12-31" },
  { label: "Lost decade", from: () => "2000-01-01", to: () => "2010-12-31" },
  { label: "Pandemic", from: () => "2020-01-01", to: () => "2021-12-31" },
  { label: "2022 bear", from: () => "2022-01-01", to: () => "2023-06-30" },
];

function TickerInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const v = (draft ?? "").trim().toUpperCase();
    setDraft(null);
    if (v && v !== value) onCommit(v);
  };
  return (
    <input
      aria-label="Ticker symbol"
      className="figures w-full border-b-2 border-ink bg-transparent py-1 text-3xl font-medium uppercase tracking-wide outline-none focus:bg-highlight"
      value={draft ?? value}
      maxLength={15}
      spellCheck={false}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
    />
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="kicker text-ink-faint">{label}</span>
      <input
        type="date"
        className="figures block w-full border-b border-ink bg-transparent py-1 text-[0.85rem] outline-none focus:bg-highlight"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function MarketSection({ s, set }: { s: Settings; set: Patch }) {
  const usesTicker = s.mode !== "simulated";
  return (
    <Section numeral="I" title="The market">
      <Segmented<MarketMode>
        label="Market source"
        value={s.mode}
        onChange={(mode) => set({ mode })}
        options={[
          { value: "history", label: "History" },
          { value: "bootstrap", label: "Reshuffled" },
          { value: "simulated", label: "Synthetic" },
        ]}
      />
      <p className="mt-2 text-[0.82rem] italic leading-snug text-ink-soft">
        {s.mode === "history" && "The actual daily closes, dividends included, played back once."}
        {s.mode === "bootstrap" && "Real daily moves from the window below, cut into blocks and reshuffled into many alternate futures."}
        {s.mode === "simulated" && "Random markets with the drift, volatility and crash habits you choose."}
      </p>

      {usesTicker && (
        <div className="mt-4 space-y-3">
          <TickerInput value={s.symbol} onCommit={(symbol) => set({ symbol })} />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {TICKERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set({ symbol: t })}
                className={`figures text-[0.75rem] underline-offset-4 hover:underline ${t === s.symbol ? "text-accent underline" : "text-ink-soft"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DateInput label="From" value={s.from} onChange={(from) => from && set({ from })} />
            <DateInput label={s.to ? "To" : "To (latest)"} value={s.to} onChange={(to) => set({ to })} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ERAS.map((era) => (
              <button
                key={era.label}
                type="button"
                onClick={() => set({ from: era.from(), to: era.to() })}
                className="border border-rule px-2 py-0.5 text-[0.78rem] italic hover:border-ink"
              >
                {era.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {s.mode !== "history" && (
        <div className="mt-3">
          <NumberField label="Horizon" value={s.years} onChange={(years) => set({ years })} min={1} max={30} step={1} suffix="yrs" />
          <NumberField label="Markets to run" value={s.paths} onChange={(paths) => set({ paths })} min={20} max={1000} step={10} hint="More markets give steadier odds and take longer." />
          {s.mode === "bootstrap" && (
            <NumberField label="Block length" value={s.block} onChange={(block) => set({ block })} min={1} max={120} step={1} suffix="days" hint="Longer blocks keep calm and stormy stretches together." />
          )}
          {s.mode === "simulated" && (
            <>
              <NumberField label="Expected return" value={s.drift} onChange={(drift) => set({ drift })} min={-0.1} max={0.25} step={0.005} scale={100} suffix="%" />
              <NumberField label="Volatility" value={s.vol} onChange={(vol) => set({ vol })} min={0.05} max={1} step={0.01} scale={100} suffix="%" />
              <NumberField label="Shocks per year" value={s.jumpsPerYear} onChange={(jumpsPerYear) => set({ jumpsPerYear })} min={0} max={6} step={0.1} />
              <NumberField label="Typical shock" value={s.jumpMean} onChange={(jumpMean) => set({ jumpMean })} min={-0.4} max={0.2} step={0.01} scale={100} suffix="%" />
              <NumberField label="Shock dispersion" value={s.jumpVol} onChange={(jumpVol) => set({ jumpVol })} min={0} max={0.3} step={0.01} scale={100} suffix="%" />
            </>
          )}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <NumberField label="Seed" value={s.seed} onChange={(seed) => set({ seed: Math.round(seed) })} min={1} max={9999} step={1} />
            </div>
            <button
              type="button"
              onClick={() => set({ seed: 1 + Math.floor(Math.random() * 9999) })}
              className="kicker mb-2 border border-ink px-2 py-1 hover:bg-ink hover:text-paper"
            >
              Reroll
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

export function Desk({ s, set, onReset }: { s: Settings; set: Patch; onReset: () => void }) {
  return (
    <div>
      <MarketSection s={s} set={set} />

      <Section numeral="II" title="The account">
        <NumberField label="Starting capital" value={s.capital} onChange={(capital) => set({ capital })} min={1000} max={5_000_000} step={1000} prefix="$" />
        <NumberField label="Cash yield" value={s.riskFree} onChange={(riskFree) => set({ riskFree })} min={0} max={0.1} step={0.0025} scale={100} suffix="%" hint="Earned on idle cash and put collateral." />
        <NumberField label="Commission per contract" value={s.commissionPerContract} onChange={(commissionPerContract) => set({ commissionPerContract })} min={0} max={5} step={0.05} prefix="$" digits={2} />
        <NumberField label="Spread cost" value={s.slippage} onChange={(slippage) => set({ slippage })} min={0} max={0.2} step={0.005} scale={100} suffix="%" hint="Share of each option's mid price lost on every fill." />
        <Toggle label="Whole contracts only" checked={s.wholeContracts} onChange={(wholeContracts) => set({ wholeContracts })} hint="Realistic for small accounts. Off lets every strategy scale to any size." />
        <Toggle label="Reinvest premium" checked={s.reinvestPremium} onChange={(reinvestPremium) => set({ reinvestPremium })} hint="Buy more shares with collected premium in covered strategies." />
      </Section>

      <Section numeral="III" title="Option pricing">
        <NumberField label="Implied over realized" value={s.ivMultiplier} onChange={(ivMultiplier) => set({ ivMultiplier })} min={0.7} max={2} step={0.01} suffix="x" hint="How rich options trade versus the vol that shows up. History says about 1.1 to 1.2." />
        <NumberField label="Volatility skew" value={s.skew} onChange={(skew) => set({ skew })} min={0} max={0.8} step={0.01} digits={2} hint="Makes downside puts dearer and upside calls cheaper. Index options sit near 0.3, single stocks lower. Synthetic markets without shocks have no real skew, so try zero there." />
        <NumberField label="Vol lookback" value={s.volLookback} onChange={(volLookback) => set({ volLookback })} min={10} max={252} step={1} suffix="days" />
        <NumberField label="Implied vol floor" value={s.ivFloor} onChange={(ivFloor) => set({ ivFloor })} min={0} max={0.5} step={0.01} scale={100} suffix="%" />
      </Section>

      <Section numeral="IV" title="The option cycle">
        <NumberField label="Days to expiry" value={s.dte} onChange={(dte) => set({ dte })} min={3} max={365} step={1} suffix="days" />
        <NumberField label="Call delta" value={s.callDelta} onChange={(callDelta) => set({ callDelta })} min={0.05} max={0.6} step={0.01} digits={2} hint="Lower sells further out of the money: less premium, more upside kept." />
        <NumberField label="Put delta" value={s.putDelta} onChange={(putDelta) => set({ putDelta })} min={0.05} max={0.6} step={0.01} digits={2} />
        <NumberField label="Take profit at" value={s.profitTake} onChange={(profitTake) => set({ profitTake })} min={0} max={0.95} step={0.05} scale={100} suffix="%" hint="Buy back a short option once this much premium is captured. Zero holds to expiry." />
      </Section>

      <Section numeral="V" title="House rules" open={false}>
        <Toggle label="Wheel calls above cost basis" checked={s.wheelCallAboveBasis} onChange={(wheelCallAboveBasis) => set({ wheelCallAboveBasis })} hint="Never sell a call that would lock in a loss on assigned shares." />
        <NumberField label="Hedge put delta" value={s.hedgePutDelta} onChange={(hedgePutDelta) => set({ hedgePutDelta })} min={0.05} max={0.6} step={0.01} digits={2} hint="Protective put for the collar and the married put." />
        <NumberField label="Spread width" value={s.spreadWidth} onChange={(spreadWidth) => set({ spreadWidth })} min={0.01} max={0.25} step={0.005} scale={100} suffix="%" />
        <NumberField label="Spread capital at risk" value={s.spreadRisk} onChange={(spreadRisk) => set({ spreadRisk })} min={0.05} max={1} step={0.05} scale={100} suffix="%" hint="Worst case loss per cycle as a share of the account." />
        <NumberField label="Moving average" value={s.smaWindow} onChange={(smaWindow) => set({ smaWindow })} min={10} max={400} step={5} suffix="days" />
        <NumberField label="Leverage" value={s.leverage} onChange={(leverage) => set({ leverage })} min={1} max={4} step={0.25} suffix="x" digits={2} />
        <NumberField label="Leveraged fund fee" value={s.leverageFee} onChange={(leverageFee) => set({ leverageFee })} min={0} max={0.03} step={0.0005} scale={100} suffix="%" digits={2} />
        <NumberField label="Averaging period" value={s.dcaMonths} onChange={(dcaMonths) => set({ dcaMonths })} min={1} max={60} step={1} suffix="mo" />
      </Section>

      <div className="border-t border-rule pt-3">
        <button type="button" onClick={onReset} className="text-[0.85rem] italic text-ink-soft underline underline-offset-4 hover:text-accent">
          Restore the house defaults
        </button>
      </div>
    </div>
  );
}
