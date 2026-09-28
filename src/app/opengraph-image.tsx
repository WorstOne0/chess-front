import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Chess · Play Stockfish or a friend in your browser";

export default async function OpengraphImage() {
  // Read from disk rather than fetching a URL: this runs at build time, when the site is not yet serving.
  const logo = await fs.readFile(path.join(process.cwd(), "public/logo/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px",
          background: "radial-gradient(circle at 80% 50%, #0e3fa3 0%, #13161c 42%, #0b0d11 100%)",
          color: "#f4f6fb",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <span style={{ fontSize: 30, color: "#a78bfa" }}>chess.kuuhaku.dev</span>
          <span style={{ fontSize: 104, fontWeight: 800, lineHeight: 1, marginTop: 18 }}>Chess</span>
          <span style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.3, marginTop: 40 }}>
            Play Stockfish in your browser, or a friend in a private room
          </span>
          <span style={{ fontSize: 28, color: "#9aa3b5", marginTop: 24 }}>Three levels, clocks, premoves and arrows</span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={340} height={340} alt="" />
      </div>
    ),
    size
  );
}
