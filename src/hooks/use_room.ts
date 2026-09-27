"use client";

// Next
import { useEffect } from "react";
// Controllers
import { useRoomController } from "@/core/controllers";
// Services
import { joinRoom, onRoomMessage } from "@/services";

// Keeps the room controller on what the server sends, and joins `code` when there is one; null only listens.
export const useRoom = (code: string | null) => {
  const setRoom = useRoomController((state) => state.setRoom);
  const setError = useRoomController((state) => state.setError);

  useEffect(() => {
    const stop = onRoomMessage((message) => (message.type === "state" ? setRoom(message.room) : setError(message.message)));
    if (code) joinRoom(code);

    return stop;
  }, [code, setRoom, setError]);
};
