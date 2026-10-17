import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { simulatedPaths, impliedVolSeries } from "@/engine/paths";
import { simulators } from "@/engine/strategies";
import { defaultParams, type StrategyId } from "@/engine/types";

export const shareSize = { width: 1200, height: 630 };
export const shareAlt = "Compario: buy and hold, covered calls, the wheel and more, charted side by side";

const PAPER = "#f4efe4";
const INK = "#1c1a16";
const SOFT = "#4a463d";
const RULE = "#cfc6b2";

const LINES: { id: StrategyId; color: string; label: string }[] = [
  { id: "hold", color: INK, label: "Hold" },
  { id: "coveredCall", color: "#b0412e", label: "Calls" },
  { id: "cashPut", color: "#2f6b4a", label: "Puts" },
  { id: "wheel", color: "#b07d12", label: "Wheel" },
  { id: "collar", color: "#2a5d8f", label: "Collar" },
];

/** A real engine run on a fixed synthetic market, so the preview chart is honest too. */
function curves(w: number, h: number) {
  const [path] = simulatedPaths({ years: 6, drift: 0.09, vol: 0.2, jumpsPerYear: 0.5, jumpMean: -0.12, jumpVol: 0.05, paths: 1, seed: 11 });
  const iv = impliedVolSeries(path, 30, defaultParams.ivMultiplier, defaultParams.ivFloor);
  const runs = LINES.map((l) => ({ ...l, eq: simulators[l.id](path, iv, defaultParams).equity }));
  const all = runs.flatMap((r) => Array.from(r.eq));
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const n = path.length;
  const step = 4;
  return runs.map((r) => {
    const pts: string[] = [];
    for (let i = 0; i < n; i += step) pts.push(`${((i / (n - 1)) * w).toFixed(1)},${(h - ((r.eq[i] - lo) / (hi - lo)) * h).toFixed(1)}`);
    return { ...r, d: `M${pts.join("L")}`, endY: h - ((r.eq[n - 1] - lo) / (hi - lo)) * h };
  });
}

export async function renderShareCard() {
  const dir = join(process.cwd(), "assets/fonts");
  const [display, italic, mono] = await Promise.all([
    readFile(join(dir, "Newsreader-Display.ttf")),
    readFile(join(dir, "Newsreader-Italic.ttf")),
    readFile(join(dir, "PlexMono-Medium.ttf")),
  ]);
  const cw = 540;
  const ch = 330;
  const lines = curves(cw, ch);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, color: INK, padding: "44px 60px", fontFamily: "Newsreader" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Plex", fontSize: 16, letterSpacing: 3, color: SOFT, borderBottom: `2px solid ${INK}`, paddingBottom: 10 }}>
          <span>VOL. I</span>
          <span>STRATEGIES, SIDE BY SIDE</span>
          <span>NOT ADVICE</span>
        </div>
        <div style={{ display: "flex", flex: 1, marginTop: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 500, paddingRight: 36 }}>
            <div style={{ fontSize: 100, fontWeight: 600, lineHeight: 0.9, letterSpacing: -3.5 }}>Compario</div>
            <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.08, marginTop: 30 }}>Eleven ways to own a stock, tested on the same tape.</div>
            <div style={{ fontFamily: "Newsreader Italic", fontSize: 24, lineHeight: 1.3, color: SOFT, marginTop: 18 }}>
              Buy and hold, the wheel, covered calls, puts, collars and more, priced day by day.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${RULE}`, paddingLeft: 36, flex: 1 }}>
            <div style={{ fontFamily: "Plex", fontSize: 14, letterSpacing: 2.5, color: SOFT, marginBottom: 14 }}>ACCOUNT VALUE, ONE SYNTHETIC MARKET</div>
            <div style={{ display: "flex", position: "relative", width: cw, height: ch }}>
              <svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`}>
                {[0, 1, 2, 3].map((k) => (
                  <line key={k} x1={0} x2={cw - 70} y1={(ch / 3) * k} y2={(ch / 3) * k} stroke={RULE} strokeWidth={1} />
                ))}
                {lines.map((l) => (
                  <path key={l.id} d={l.d} fill="none" stroke={l.color} strokeWidth={l.id === "hold" ? 4 : 2.6} strokeLinejoin="round" transform={`scale(${(cw - 70) / cw},1)`} />
                ))}
              </svg>
              {[...lines]
                .sort((a, b) => a.endY - b.endY)
                .map((l, i, arr) => {
                  const y = Math.max(l.endY, i > 0 ? arr[i - 1].endY + 22 : 0);
                  arr[i] = { ...l, endY: y };
                  return (
                    <div key={l.id} style={{ position: "absolute", left: cw - 62, top: Math.min(y, ch - 20) - 11, fontFamily: "Plex", fontSize: 17, color: l.color }}>
                      {l.label}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${INK}`, marginTop: 18 }} />
        <div style={{ display: "flex", borderTop: `1px solid ${INK}`, marginTop: 3, paddingTop: 10, fontFamily: "Plex", fontSize: 15, letterSpacing: 2, color: SOFT }}>
          REAL HISTORY  /  RESHUFFLED MARKETS  /  MONTE CARLO
        </div>
      </div>
    ),
    {
      ...shareSize,
      fonts: [
        { name: "Newsreader", data: display, weight: 600, style: "normal" },
        { name: "Newsreader Italic", data: italic, weight: 400, style: "italic" },
        { name: "Plex", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
