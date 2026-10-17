import type { Metadata } from "next";
import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { catalogById } from "@/engine/catalog";
import { glossary, strategyGuides } from "@/content/guide";

export const metadata: Metadata = {
  title: "The guide",
  description: "Why Compario exists, how it keeps the comparison fair, and how each of the eleven strategies works, when it shines and what it costs.",
};

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Same tape, same money, same costs",
    body: "Every strategy is replayed day by day on exactly the same prices, starting with the same capital and paying the same commissions and spreads. Most claims you read online compare a strategy to nothing, or to a different period, or ignore fees. Here the only thing that changes is the strategy.",
  },
  {
    title: "Buy and hold is the bar",
    body: "Owning the stock and doing nothing is free, simple and hard to beat. So it is always on the page, and every other strategy is judged against it. If a strategy cannot beat holding, it needs to at least deliver a calmer ride to justify the extra work.",
  },
  {
    title: "Return is only half the story",
    body: "A strategy that earns a little less but falls half as far in a crash can be the better choice for a real person. That is why the drawdown chart sits right under the growth chart, and why the standings include volatility, Sharpe, Sortino and the worst month alongside annual return.",
  },
  {
    title: "One history is one roll of the dice",
    body: "A single backtest shows what happened, not what was likely. A strategy can win because of a lucky crash date or a well timed rally. Reshuffled and synthetic markets replay thousands of alternate paths, so you see the odds of winning and the range of outcomes, not just one result.",
  },
  {
    title: "Honest about what it cannot know",
    body: "Free historical option prices do not exist, so options are priced with a model, and taxes and early assignment are left out. Each of those gaps tends to flatter option selling, so the site says so plainly and every model assumption is a dial you can move.",
  },
];

const MARKETS: { name: string; question: string; body: string }[] = [
  {
    name: "History",
    question: "What would have happened?",
    body: "Real daily closing prices for any ticker, adjusted for splits and dividends. Pick a window yourself or jump to a famous era like the financial crisis, the lost decade or the 2022 bear market.",
  },
  {
    name: "Reshuffled",
    question: "What if the same kind of market had played out in a different order?",
    body: "The ticker's real daily moves are cut into blocks of consecutive days and stitched together at random into hundreds of alternate futures. The character of the stock stays, but the luck of the timing is shuffled away.",
  },
  {
    name: "Synthetic",
    question: "What if the market behaved like this?",
    body: "Random markets built from the expected return, volatility and crash frequency you choose. Useful for stress tests: more crashes, a flat decade, a wild high volatility stock.",
  },
];

function Head({ kicker, title, id }: { kicker: string; title: string; id?: string }) {
  return (
    <div id={id} className="mb-5 scroll-mt-6 border-t-2 border-ink pt-2">
      <p className="kicker text-accent">{kicker}</p>
      <h2 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold leading-tight tracking-tight">{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="kicker text-ink-faint">{label}</p>
      <p className="mt-0.5 text-[0.97rem] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-6">
      <Masthead />

      <article className="mx-auto mt-10 max-w-[980px]">
        <header>
          <p className="kicker text-accent">The guide</p>
          <h1 className="mt-2 max-w-[20ch] text-[clamp(2.3rem,5.4vw,4.2rem)] font-semibold leading-[1.02] tracking-[-0.02em]" style={{ fontVariationSettings: '"opsz" 60' }}>
            Why Compario exists, and what each strategy really does
          </h1>
          <p className="dropcap mt-6 max-w-[68ch] text-[1.15rem] leading-relaxed text-ink-soft">
            Anyone who gets curious about options hears the same promises. Sell covered calls for free income. The wheel never loses. Sell puts and get
            paid to wait. Those claims usually rest on a screenshot, a single good year, or a comparison that quietly leaves out fees and crashes. It is
            surprisingly hard to find out whether any of these strategies actually beats just buying the stock and holding it, and what it risks along the
            way.
          </p>
          <p className="mt-4 max-w-[68ch] text-[1.15rem] leading-relaxed text-ink-soft">
            Compario is built to answer that question fairly. It replays eleven popular ways to own a stock on the same prices, with the same money and
            the same costs, and shows the result as plainly as a newspaper would: who won, by how much, and what each one had to endure to get there.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="kicker border border-ink bg-ink px-4 py-2.5 text-paper hover:bg-transparent hover:text-ink">
              Open the desk
            </Link>
            <a href="#strategies" className="kicker border border-ink px-4 py-2.5 hover:bg-ink hover:text-paper">
              Skip to the strategies
            </a>
          </div>
        </header>

        <section className="mt-14">
          <Head kicker="The reasoning" title="Five rules that keep the comparison honest" />
          <ol className="grid gap-x-10 gap-y-7 md:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="flex gap-4">
                <span className="figures text-3xl leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-xl font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-1 text-[0.98rem] leading-relaxed text-ink-soft">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <Head kicker="The markets" title="Three ways to test a strategy" />
          <div className="grid gap-6 md:grid-cols-3">
            {MARKETS.map((m) => (
              <div key={m.name} className="border-t border-rule pt-3">
                <p className="kicker">{m.name}</p>
                <h3 className="mt-1 text-lg font-semibold italic leading-snug">{m.question}</h3>
                <p className="mt-2 text-[0.96rem] leading-relaxed text-ink-soft">{m.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <Head kicker="The strategies" title="Eleven ways to own a stock" id="strategies" />
          <nav aria-label="Strategies" className="mb-10 flex flex-wrap gap-x-1 gap-y-1.5">
            {strategyGuides.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="flex items-center gap-1.5 border border-rule px-2 py-1 text-[0.88rem] hover:border-ink">
                <span className="inline-block h-2 w-2 rotate-45" style={{ background: `var(--s-${g.id})` }} />
                {catalogById[g.id].name}
              </a>
            ))}
          </nav>

          <div className="space-y-12">
            {strategyGuides.map((g, i) => {
              const info = catalogById[g.id];
              const tryIt = g.id === "hold" ? "/?strategies=hold" : `/?strategies=hold,${g.id}`;
              return (
                <section key={g.id} id={g.id} className="scroll-mt-6 border-t border-ink pt-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="kicker" style={{ color: `var(--s-${g.id})` }}>
                        {String(i + 1).padStart(2, "0")} / {info.family}
                      </p>
                      <h3 className="text-[1.9rem] font-semibold leading-tight tracking-tight">{info.name}</h3>
                      <p className="text-lg italic text-ink-soft">{g.tagline}</p>
                    </div>
                    <Link href={tryIt} className="kicker border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper">
                      {g.id === "hold" ? "See it on the desk" : "Test it against holding"}
                    </Link>
                  </div>
                  <span className="mt-3 block h-[3px] w-16" style={{ background: `var(--s-${g.id})` }} />
                  <div className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2">
                    <Field label="How it works">{g.how}</Field>
                    <Field label="Why people use it">{g.why}</Field>
                    <Field label="The catch">{g.catch}</Field>
                    <div className="grid gap-4">
                      <Field label="Shines in">{g.shines}</Field>
                      <Field label="Struggles in">{g.struggles}</Field>
                    </div>
                  </div>
                  <div className="mt-4 bg-paper-deep px-4 py-3">
                    <p className="kicker text-ink-faint">Dials on the desk that matter most</p>
                    <ul className="mt-1 list-none space-y-0.5 text-[0.93rem] text-ink-soft">
                      {g.dials.map((d) => (
                        <li key={d} className="before:mr-2 before:text-accent before:content-['\25C6']">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="mt-16">
          <Head kicker="Reading the results" title="What every number on the desk means" />
          <p className="mb-5 max-w-[68ch] text-[1.02rem] leading-relaxed text-ink-soft">
            The headline names the strategy with the best annual return and compares it to buy and hold. The first chart shows how the account grew; the
            second shows how far it fell from each high, which is where the real differences between strategies usually hide. When many markets are run,
            every figure is the median market, and the spread chart shows how wide the range of outcomes was.
          </p>
          <dl className="grid gap-x-10 gap-y-3 md:grid-cols-2">
            {glossary.map((g) => (
              <div key={g.term} className="border-t border-rule pt-2">
                <dt className="font-semibold">{g.term}</dt>
                <dd className="text-[0.95rem] leading-relaxed text-ink-soft">{g.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16">
          <Head kicker="What it is not" title="The limits, stated up front" />
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold">Not a trading tool</h3>
              <p className="mt-1 text-[0.96rem] leading-relaxed text-ink-soft">It never connects to a broker, places an order or sends a signal. It is for understanding trade offs before any money moves.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Not investment advice</h3>
              <p className="mt-1 text-[0.96rem] leading-relaxed text-ink-soft">Past prices do not promise future prices, and a strategy that won one decade can lose the next. Your situation, taxes and goals matter more than any backtest.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Not a perfect simulator</h3>
              <p className="mt-1 text-[0.96rem] leading-relaxed text-ink-soft">Option prices are modeled, rates are held constant, and taxes and early assignment are ignored. Treat the income strategies&rsquo; results as a best case.</p>
            </div>
          </div>
        </section>

        <section className="mt-16 border-y-2 border-ink py-8 text-center">
          <p className="kicker text-accent">Your turn</p>
          <p className="mx-auto mt-2 max-w-[30ch] text-[clamp(1.6rem,3.2vw,2.3rem)] font-semibold leading-tight">Pick a stock, pick a decade, and see who wins.</p>
          <Link href="/" className="kicker mt-5 inline-block border border-ink bg-ink px-5 py-3 text-paper hover:bg-transparent hover:text-ink">
            Open the desk
          </Link>
        </section>
      </article>

      <footer className="mt-16 border-t-2 border-ink pt-3">
        <div className="kicker flex flex-wrap justify-between gap-2 text-ink-faint">
          <span>Compario. The guide.</span>
          <span>For education. Past tape does not promise future tape.</span>
        </div>
      </footer>
    </div>
  );
}
