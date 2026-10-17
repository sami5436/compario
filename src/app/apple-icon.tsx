import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bar = (left: number, height: number, color: string) => (
    <div style={{ position: "absolute", left, bottom: 34, width: 26, height, background: color }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#1c1a16" }}>
        {bar(36, 48, "#f3eee2")}
        {bar(77, 76, "#f3eee2")}
        {bar(118, 106, "#b0412e")}
        <div style={{ position: "absolute", left: 28, bottom: 26, width: 124, height: 6, background: "#f3eee2" }} />
      </div>
    ),
    size,
  );
}
