// Next
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
// Components
import Providers from "./providers";
// Styles
import "@/styles/index.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

const DESCRIPTION = "Play chess against Stockfish in your browser, or against a friend in a private room.";

// Server component on purpose: "use client" here would silently drop metadata.
export const metadata: Metadata = {
  metadataBase: new URL("https://chess.kuuhaku.dev"),
  title: { default: "Chess", template: "%s · Chess" },
  description: DESCRIPTION,
  applicationName: "Chess",
  icons: { icon: "/logo/icon.png", apple: "/logo/apple-icon.png" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Chess",
    title: "Chess · Play Stockfish or a friend in your browser",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning covers the class next-themes puts on <html>.
    <html lang="en" suppressHydrationWarning className={nunito.variable}>
      <body className="h-full w-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
