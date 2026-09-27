// Next
import { create } from "zustand";
// Models
import type { RoomState } from "@/core/models";

// The last room snapshot the server sent; the game controller plays its moves, the room screens read its status.
type RoomController = {
  room: RoomState | null;
  error: string | null;
  setRoom: (room: RoomState | null) => void;
  setError: (error: string | null) => void;
};

export const useRoomController = create<RoomController>((set) => ({
  room: null,
  error: null,
  setRoom: (room) => set({ room, error: null }),
  setError: (error) => set({ error }),
}));
