/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import useSound from "use-sound";
// Hooks
import { useMount } from "@/hooks";
// Store
import { useGameState } from "@/store";
// Components
import { Cell, GameOver, Promotion } from "@/components";
//
import { RiTimerLine } from "react-icons/ri";

import white_bishop from "@/../public/neo/white_bishop.svg";
import white_knight from "@/../public/neo/white_knight.svg";
import white_queen from "@/../public/neo/white_queen.svg";
import white_rook from "@/../public/neo/white_rook.svg";
import white_pawn from "@/../public/neo/white_pawn.svg";

export default function Board() {
  const { board, selectPiece, makeMove, previousMoves, capturedPieces } = useGameState((state) => state);
  const [whiteTime, setWhiteTime] = useState(180);
  const [blackTime, setBlackTime] = useState(180);

  const [moveSelfAudio] = useSound("/sound/move-self.mp3");
  const [captureAudio] = useSound("/sound/capture.mp3");
  const [moveCheckAudio] = useSound("/sound/move-check.mp3");
  const [promoteAudio] = useSound("/sound/promote.mp3");
  const [castleAudio] = useSound("/sound/castle.mp3");

  useMount(() => {});

  useEffect(() => {
    const interval = setInterval(() => {
      if (previousMoves.length === 0) return;

      if (board.currentPlayerTurn === "white") setWhiteTime((prevTime) => Math.max(0, prevTime - 1));
      else setBlackTime((prevTime) => Math.max(0, prevTime - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [whiteTime, blackTime, board.currentPlayerTurn, previousMoves.length]);

  const myClock = () => {
    const seconds = whiteTime % 60;
    const minutes = Math.floor(whiteTime / 60);

    const secondsString = seconds < 10 ? `0${seconds}` : seconds.toString();
    const minutesString = minutes < 10 ? `0${minutes}` : minutes.toString();

    return `${minutesString}:${secondsString}`;
  };

  const opponentClock = () => {
    const seconds = blackTime % 60;
    const minutes = Math.floor(blackTime / 60);

    const secondsString = seconds < 10 ? `0${seconds}` : seconds.toString();
    const minutesString = minutes < 10 ? `0${minutes}` : minutes.toString();

    return `${minutesString}:${secondsString}`;
  };

  const onDragStart = (event: DragStartEvent) => {
    selectPiece(event.active.data.current?.piece);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { sound } = makeMove(event.over?.data.current?.position);
    if (!sound) return;

    if (sound == "move-self.mp3") moveSelfAudio();
    if (sound == "capture.mp3") captureAudio();
    if (sound == "move-check.mp3") moveCheckAudio();
    if (sound == "promote.mp3") promoteAudio();
    if (sound == "castle.mp3") castleAudio();
  };

  const handleCapturedPieces = (color: string) => {
    const order = ["pawn", "knight", "bishop", "rook", "queen"];
    const pieces = capturedPieces.filter((piece) => piece.color === color).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    const images: Record<string, any> = {
      queen: white_queen,
      rook: white_rook,
      knight: white_knight,
      bishop: white_bishop,
      pawn: white_pawn,
    };

    return (
      <div className="flex">
        {pieces.map((piece) => (
          <Image
            key={`${piece.type}_${piece.color}`}
            className="h-[1.8rem] w-[1.8rem] mr-[0.3rem] mb-[0.4rem]"
            src={images[piece.type]}
            alt="queen"
          />
        ))}
      </div>
    );
  };

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd} modifiers={[snapCenterToCursor]}>
      <div className="h-full w-full flex flex-col bg-background select-none">
        {/* Opponent */}
        <div className="min-h-[6rem] h-[6rem] w-full flex justify-between items-center px-[2rem] mb-[1.5rem]">
          <div className="flex items-center">
            <div className="w-[5rem] h-[5rem] bg-primary rounded-[0.8rem]"></div>
            <div className="flex flex-col ml-[1.5rem]">
              <span className="">Opponent</span>
              <div className="h-[1.8rem] w-full">{handleCapturedPieces("white")}</div>
            </div>
          </div>
          <div className="h-[4rem] w-[10rem] bg-primary rounded-[0.8rem] flex justify-center items-center">
            <RiTimerLine className="mr-[0.8rem]" size={22} color="white" />
            <span className="text-[1.6rem] text-white font-bold">{opponentClock()}</span>
          </div>
        </div>

        {/* Header */}
        <div className="min-h-0 grow w-full flex justify-center items-center">
          <div className="max-h-full w-[78rem] aspect-square relative">
            <div className="h-full w-full grid grid-cols-8 grid-rows-8 bg-[#826247] rounded-[0.8rem] overflow-hidden shadow-xl/20">
              {board.board.map((row, indexRow) => {
                return row.map((piece, indexColumn) => (
                  <Cell key={`cell_${indexRow}_${indexColumn}`} row={indexRow} column={indexColumn} piece={piece} />
                ));
              })}
            </div>

            <Promotion />
            <GameOver />
          </div>
        </div>

        {/* Player */}
        <div className="min-h-[6rem] h-[6rem] w-full flex justify-between items-center px-[2rem] my-[1.5rem]">
          <div className="flex items-center">
            <div className="w-[5rem] h-[5rem] bg-primary rounded-[0.8rem]"></div>
            <div className="flex flex-col ml-[1.5rem]">
              <span className="">Player</span>
              <div className="h-[1.8rem] w-full">{handleCapturedPieces("black")}</div>
            </div>
          </div>
          <div className="h-[4rem] w-[10rem] bg-primary rounded-[0.8rem] flex justify-center items-center">
            <RiTimerLine className="mr-[0.8rem]" size={22} color="white" />
            <span className="text-[1.6rem] text-white font-bold">{myClock()}</span>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
