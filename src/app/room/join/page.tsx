"use client";

// Next
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
// Controllers
import { useRoomController } from "@/core/controllers";
// Services
import { joinRoom } from "@/services";
// Hooks
import { useRoom } from "@/hooks";
// Components
import { BackLink, Chip } from "@/components";
// Icons
import { MdOutlineArrowForward, MdOutlineGroup, MdOutlineKeyboard, MdOutlineLink } from "react-icons/md";

const LENGTH = 6;

// The invite link and the QR code open this page with ?code=, so the letters arrive filled in.
export default function JoinRoomPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const initialCode = (use(searchParams).code ?? "").toUpperCase().replace(/[^A-Z]/g, "");
  const router = useRouter();
  const room = useRoomController((state) => state.room);
  const error = useRoomController((state) => state.error);
  const setError = useRoomController((state) => state.setError);

  const [letters, setLetters] = useState(() => Array.from({ length: LENGTH }, (_, index) => initialCode[index] ?? ""));
  const [link, setLink] = useState("");
  // The code asked for; the room controller answers with the room or an error
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const isComplete = letters.every(Boolean);

  useRoom(null);

  useEffect(() => {
    if (joiningCode && room?.code === joiningCode && room.status !== "waiting") router.replace(`/game?room=${joiningCode}`);
  }, [room, joiningCode, router]);

  const join = () => {
    const code = letters.join("");

    setError(null);
    setJoiningCode(code);
    joinRoom(code);
  };

  // Typing, pasting and the invite link all land here; letters fill from `from` and focus moves past them
  const fill = (text: string, from = 0) => {
    const clean = text.toUpperCase().replace(/[^A-Z]/g, "").slice(0, LENGTH - from);
    const next = [...letters];

    clean.split("").forEach((letter, index) => (next[from + index] = letter));
    setLetters(next);
    setJoiningCode(null);
    inputs.current[Math.min(from + clean.length, LENGTH - 1)]?.focus();
  };

  const clear = (index: number) => {
    const next = [...letters];

    next[index] = "";
    setLetters(next);
    setJoiningCode(null);
  };

  const openLink = () => fill(link.match(/code=([A-Za-z]{6})/)?.[1] ?? link.trim());

  return (
    <div className="h-full w-full px-[6.4rem] pt-[4rem] pb-[3.6rem] flex flex-col bg-background">
      <div className="flex items-center justify-between">
        <BackLink />
        <Chip Icon={MdOutlineGroup} label="Multiplayer" />
      </div>

      <div className="min-h-0 flex-1 flex items-center justify-center">
        <div className="w-[64rem] px-[4.8rem] py-[4.4rem] flex flex-col gap-[3rem] rounded-[3.2rem] bg-surface shadow-raise-lg">
          <div className="flex flex-col items-center gap-[0.8rem] text-center">
            <span className="mb-[0.8rem] h-[6.4rem] w-[6.4rem] flex items-center justify-center rounded-[2rem] bg-surface shadow-inset">
              <MdOutlineKeyboard size={28} />
            </span>
            <h1 className="text-[3.4rem] font-extrabold tracking-[-0.04rem]">Join a room</h1>
            <p className="text-[1.6rem] text-meta">Type the 6-letter code your friend sent you</p>
          </div>

          <div className="flex flex-col gap-[1.2rem]">
            <label htmlFor="code-0" className="label">
              Room code
            </label>
            <div className="flex gap-[1.2rem]">
              {letters.map((letter, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  maxLength={1}
                  value={letter}
                  aria-label={`Letter ${index + 1}`}
                  onChange={(event) => (event.target.value ? fill(event.target.value.slice(-1), index) : clear(index))}
                  onPaste={(event) => {
                    event.preventDefault();
                    fill(event.clipboardData.getData("text"), index);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !letter) inputs.current[index - 1]?.focus();
                  }}
                  className="h-[8.4rem] min-w-0 flex-1 rounded-[1.8rem] bg-surface shadow-inset text-center text-[4rem] font-extrabold uppercase outline-none focus:ring-[0.2rem] focus:ring-accent"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[1rem]">
            <button
              type="button"
              disabled={!isComplete || (!!joiningCode && !error)}
              onClick={join}
              className="h-[6rem] flex items-center justify-center gap-[1rem] rounded-[1.8rem] bg-action text-on-action shadow-action text-[1.8rem] font-extrabold active:shadow-inset disabled:opacity-50"
            >
              {joiningCode && !error ? "Joining…" : "Join room"}
              <MdOutlineArrowForward size={20} />
            </button>
            {joiningCode && error && <span className="text-center text-[1.4rem] text-meta">{error}</span>}
          </div>

          <div className="flex items-center gap-[1.6rem] text-[1.3rem] font-bold tracking-[0.1rem] uppercase text-faint">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="flex flex-col gap-[1rem]">
            <label htmlFor="invite-link" className="label">
              Paste an invite link
            </label>
            <div className="flex gap-[1rem]">
              <div className="h-[5.2rem] min-w-0 flex-1 px-[1.6rem] flex items-center gap-[1rem] rounded-[1.4rem] bg-surface shadow-inset">
                <MdOutlineLink size={18} className="shrink-0 text-meta" />
                <input
                  id="invite-link"
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && openLink()}
                  placeholder="https://chess.kuuhaku.dev/room/join?code=…"
                  className="min-w-0 flex-1 bg-transparent text-[1.5rem] font-bold outline-none placeholder:text-faint"
                />
              </div>
              <button type="button" onClick={openLink} className="h-[5.2rem] px-[2.2rem] rounded-[1.4rem] bg-surface shadow-raise text-[1.5rem] font-extrabold active:shadow-inset">
                Open
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
