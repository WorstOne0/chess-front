// Next
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
// Components
import Providers from "./providers";
// Styles
import "@/styles/index.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

// Server component on purpose: "use client" here would silently drop metadata.
export const metadata: Metadata = {
  title: { default: "Chess", template: "%s · Chess" },
  description: "Play chess against Stockfish, right in the browser.",
  applicationName: "Chess",
  icons: { icon: "/logo/icon.png", apple: "/logo/apple-icon.png" },
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
