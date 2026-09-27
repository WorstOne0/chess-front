// Next
import type { Metadata } from "next";

// Here and not in the page: a "use client" page cannot export metadata.
export const metadata: Metadata = { title: "Join room" };

export default function JoinRoomLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
