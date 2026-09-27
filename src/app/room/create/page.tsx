// Next
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
// Models
import { TIME_CONTROLS, type TimeControl } from "@/core/models";
// Services
import { createRoom } from "@/services";
// Components
import CreateRoomView from "./_components/create_room_view";

export const metadata: Metadata = { title: "Create room" };

// The room is created here on the server, so each visit gets a fresh one and the QR encoder never ships to the browser.
export default async function CreateRoomPage({ searchParams }: { searchParams: Promise<{ time?: string }> }) {
  const { time } = await searchParams;
  const timeControl = (time && time in TIME_CONTROLS ? time : "3+0") as TimeControl;

  const code = await createRoom(timeControl).catch(() => null);
  if (!code) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-[2rem] bg-background">
        <span className="text-[1.8rem] font-bold text-meta">The room server is not answering, try again in a moment.</span>
        <Link href="/" className="h-[4.8rem] px-[2.2rem] flex items-center rounded-[1.4rem] bg-surface shadow-raise text-[1.5rem] font-extrabold active:shadow-inset">
          Back home
        </Link>
      </div>
    );
  }

  const requestHeaders = await headers();
  const link = `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}/room/join?code=${code}`;

  // Every dark module as one path, one unit per module, so the SVG scales without blurring
  const { modules } = QRCode.create(link, { errorCorrectionLevel: "M" });
  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) if (modules.get(row, column)) path += `M${column} ${row}h1v1h-1z`;
  }

  return <CreateRoomView code={code} link={link} timeControl={timeControl} qr={{ size: modules.size, path }} />;
}
