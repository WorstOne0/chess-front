"use client";

import Image from "next/image";
import useSound from "use-sound";
//
import { useGameState } from "@/store";

import black_bishop from "@/../public/neo/black_bishop.svg";
import black_knight from "@/../public/neo/black_knight.svg";
import black_queen from "@/../public/neo/black_queen.svg";
import black_rook from "@/../public/neo/black_rook.svg";
import white_bishop from "@/../public/neo/white_bishop.svg";
import white_knight from "@/../public/neo/white_knight.svg";
import white_queen from "@/../public/neo/white_queen.svg";
import white_rook from "@/../public/neo/white_rook.svg";

const images = {
  white: { queen: white_queen, rook: white_rook, bishop: white_bishop, knight: white_knight },
  black: { queen: black_queen, rook: black_rook, bishop: black_bishop, knight: black_knight },
};

export default function Promotion() {
  const { pendingPromotion, choosePromotion } = useGameState((state) => state);

  const [captureAudio] = useSound("/sound/capture.mp3");
  const [promoteAudio] = useSound("/sound/promote.mp3");
  const [moveCheckAudio] = useSound("/sound/move-check.mp3");

  if (!pendingPromotion) return <></>;

  const color = pendingPromotion.piece.color === "white" ? "white" : "black";

  const handleClick = (promotion: string) => {
    const { sound } = choosePromotion(promotion);

    if (sound == "capture.mp3") captureAudio();
    if (sound == "promote.mp3") promoteAudio();
    if (sound == "move-check.mp3") moveCheckAudio();
  };

  return (
    <div className="absolute top-0 left-0 h-full w-full flex justify-center items-center bg-black/[0.5] rounded-[0.8rem] z-[50]">
      <div className="flex flex-col items-center bg-white rounded-[0.8rem] p-[2rem] shadow-xl/20">
        <span className="text-[1.8rem] text-primary font-bold mb-[1.5rem]">Promote to</span>

        <div className="flex space-x-[1rem]">
          {(["queen", "rook", "bishop", "knight"] as const).map((promotion) => (
            <button
              key={promotion}
              onClick={() => handleClick(promotion)}
              className="h-[8rem] w-[8rem] flex justify-center items-center bg-[#f0d9b5] hover:bg-[#b58863] rounded-[0.8rem] cursor-pointer transition-colors"
            >
              <Image className="h-[80%] w-[80%]" src={images[color][promotion]} alt={promotion} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
