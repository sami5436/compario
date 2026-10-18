import type { Metadata } from "next";
import { ShortVersion } from "@/components/ShortVersion";

export const metadata: Metadata = {
  title: "The short version",
  description: "If you put $10,000 into a stock, where would it have ended up under eleven different strategies? Plain numbers, no jargon.",
};

export default function TldrPage() {
  return <ShortVersion />;
}
