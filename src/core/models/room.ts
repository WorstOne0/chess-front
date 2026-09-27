// Models
import type { GameResult } from "./chess";
import type { TimeControl } from "./settings";

// What chess_backend sends each player after every change; mirrors roomView in chess_backend/src/features/rooms.
export type RoomState = {
  code: string;
  status: "waiting" | "playing" | "over";
  // Goes up on every rematch, so a client can tell a new game from the same one
  game: number;
  color: string | null;
  side: string;
  timeControl: TimeControl;
  moves: string[];
  clocks: Record<string, number>;
  isClockRunning: boolean;
  result: GameResult | null;
  drawOffer: string | null;
  rematch: string[];
  isOpponentConnected: boolean;
};
