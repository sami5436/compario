const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  name: "Compario",
  tagline: "Eleven ways to own a stock, tested side by side.",
  description:
    "Backtest buy and hold, the wheel, covered calls, cash secured puts, collars and more against real prices or thousands of simulated markets.",
  url: productionHost ? `https://${productionHost}` : "http://localhost:3000",
};
