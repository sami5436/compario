import { runBacktest, type RunInput } from "./run";

interface Job {
  id: number;
  input: RunInput;
}

self.onmessage = (event: MessageEvent<Job>) => {
  const { id, input } = event.data;
  try {
    self.postMessage({ id, output: runBacktest(input) });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : "The engine stopped unexpectedly." });
  }
};
