// Next
import type { Metadata } from "next";

// Here and not in the page: a "use client" page cannot export metadata.
export const metadata: Metadata = { title: "Play" };

export default function GameLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
