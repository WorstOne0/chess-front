"use client";

// Next
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Controllers
import { useRoomController } from "@/core/controllers";
// Models
import { TIME_CONTROLS, type TimeControl } from "@/core/models";
// Services
import { leaveRoom, sendRoom } from "@/services";
// Hooks
import { useRoom } from "@/hooks";
// Components
import { BackLink, Chip, IconButton, Segmented } from "@/components";
// Icons
import { MdOutlineCheck, MdOutlineContentCopy, MdOutlineGroup, MdOutlineLink, MdOutlineSchedule, MdOutlineShare } from "react-icons/md";

const SIDES = [
  { value: "white", label: "White" },
  { value: "random", label: "Random" },
  { value: "black", label: "Black" },
];

// The creator waits here, already in the room; the moment the friend joins, both are sent to the game.
export default function CreateRoomView({ code, link, timeControl, qr }: { code: string; link: string; timeControl: TimeControl; qr: { size: number; path: string } }) {
  const router = useRouter();
  const room = useRoomController((state) => state.room);
  const error = useRoomController((state) => state.error);

  const [side, setSide] = useState("random");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const { minutes, increment } = TIME_CONTROLS[timeControl];

  useRoom(code);

  useEffect(() => {
    if (room?.code === code && room.status !== "waiting") router.replace(`/game?room=${code}`);
  }, [room, code, router]);

  const pickSide = (value: string) => {
    setSide(value);
    sendRoom({ type: "side", side: value });
  };

  const copy = async (text: string, what: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };

  const share = () => {
    if (navigator.share) return navigator.share({ title: "Chess room", url: link });
    copy(link, "link");
  };

  return (
    <div className="h-full w-full px-[6.4rem] pt-[4rem] pb-[3.6rem] flex flex-col bg-background">
      <div className="flex items-center justify-between">
        <BackLink />
        <div className="flex items-center gap-[1.2rem]">
          <Chip Icon={MdOutlineGroup} label="Multiplayer" />
          <Chip Icon={MdOutlineSchedule} label={`${minutes} min +${increment}`} />
        </div>
      </div>

      <div className="min-h-0 flex-1 flex items-center justify-center">
        <div className="w-[88rem] px-[4.4rem] py-[4rem] flex flex-col gap-[2.8rem] rounded-[3.2rem] bg-surface shadow-raise-lg">
          <div className="flex flex-col gap-[0.6rem]">
            <h1 className="text-[3.4rem] font-extrabold tracking-[-0.04rem]">Room ready</h1>
            <p className="text-[1.6rem] text-meta">Share any of these with your friend. The game starts as soon as they join.</p>
          </div>

          <div className="flex gap-[3.6rem]">
            <div className="flex flex-col items-center gap-[1.2rem]">
              <div className="h-[23.6rem] w-[23.6rem] p-[1.4rem] rounded-[2.2rem] bg-white shadow-raise">
                <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} shapeRendering="crispEdges" aria-label={`QR code for ${link}`} className="h-full w-full">
                  <path d={qr.path} className="fill-black" />
                </svg>
              </div>
              <span className="text-[1.3rem] font-bold text-meta">Scan to join</span>
            </div>

            <div className="min-w-0 flex-1 flex flex-col gap-[2.2rem]">
              <div className="flex flex-col gap-[1rem]">
                <div className="flex items-center justify-between">
                  <span className="label">Room code</span>
                  <button
                    type="button"
                    onClick={() => copy(code, "code")}
                    className="h-[3.4rem] px-[1.4rem] flex items-center gap-[0.8rem] rounded-[1rem] bg-tile shadow-tile text-[1.3rem] font-extrabold active:shadow-inset"
                  >
                    {copied === "code" ? <MdOutlineCheck size={16} /> : <MdOutlineContentCopy size={16} />}
                    {copied === "code" ? "Copied" : "Copy code"}
                  </button>
                </div>
                <div className="flex gap-[1rem]">
                  {code.split("").map((letter, index) => (
                    <span key={index} className="h-[7.6rem] min-w-0 flex-1 flex items-center justify-center rounded-[1.6rem] bg-surface shadow-inset text-[4rem] font-extrabold">
                      {letter}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-[1rem]">
                <label htmlFor="room-link" className="label">
                  Invite link
                </label>
                <div className="flex gap-[1rem]">
                  <div className="h-[5.2rem] min-w-0 flex-1 px-[1.6rem] flex items-center gap-[1rem] rounded-[1.4rem] bg-surface shadow-inset">
                    <MdOutlineLink size={18} className="shrink-0 text-meta" />
                    <input id="room-link" type="text" readOnly value={link} className="min-w-0 flex-1 bg-transparent text-[1.5rem] font-bold outline-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(link, "link")}
                    className="h-[5.2rem] w-[12.8rem] shrink-0 flex items-center justify-center gap-[0.8rem] rounded-[1.4rem] bg-action text-on-action shadow-action text-[1.5rem] font-extrabold active:shadow-inset"
                  >
                    {copied === "link" ? <MdOutlineCheck size={18} /> : <MdOutlineContentCopy size={18} />}
                    {copied === "link" ? "Copied" : "Copy"}
                  </button>
                  <IconButton Icon={MdOutlineShare} label="Share" onClick={share} size="md" />
                </div>
              </div>

              <div className="flex flex-col gap-[1rem]">
                <span className="label">You play as</span>
                <Segmented options={SIDES} value={side} onChange={pickSide} />
              </div>
            </div>
          </div>

          <div className="pt-[2.4rem] flex items-center justify-between border-t border-line">
            <span className="flex items-center gap-[1.2rem] text-[1.6rem] font-bold text-soft">
              <span className="h-[1.2rem] w-[1.2rem] rounded-full bg-accent animate-pulse" />
              {error ?? "Waiting for your friend to join…"}
            </span>
            <Link href="/" onClick={leaveRoom} className="h-[4.8rem] px-[2.2rem] flex items-center rounded-[1.4rem] bg-surface shadow-raise text-[1.5rem] font-extrabold active:shadow-inset">
              Cancel room
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
