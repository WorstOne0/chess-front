// Models
import type { RoomState } from "@/core/models";

type RoomMessage = { type: "state"; room: RoomState } | { type: "error"; message: string };

// chess_backend; NEXT_PUBLIC_ is inlined at build time, so Docker needs it when building
const ROOMS_URL = process.env.NEXT_PUBLIC_ROOMS_URL ?? "http://localhost:5001";

let socket: WebSocket | undefined;
let joinedCode: string | undefined;
// Sent once the socket is open again, so a move made during a reconnect is not lost
const outbox: string[] = [];
const listeners = new Set<(message: RoomMessage) => void>();

// Per tab, so two tabs of one browser are two players; sessionStorage keeps it across a reload
const playerId = () => {
  const saved = sessionStorage.getItem("chess_player");
  if (saved) return saved;

  const id = crypto.randomUUID();
  sessionStorage.setItem("chess_player", id);
  return id;
};

export const createRoom = async (timeControl: string) => {
  const response = await fetch(`${ROOMS_URL}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timeControl }),
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message);

  return body.room.code as string;
};

// One socket per tab: the waiting screen opens it and the game screen keeps using it after the navigation
export const joinRoom = (code: string) => {
  // Asking again for the same room (a retry after "Room not found") only repeats the join
  if (joinedCode === code && socket?.readyState === WebSocket.OPEN) return socket.send(JSON.stringify({ type: "join", code, playerId: playerId() }));
  if (joinedCode === code && socket?.readyState === WebSocket.CONNECTING) return;

  socket?.close();
  joinedCode = code;

  const open = () => {
    const current = new WebSocket(`${ROOMS_URL.replace(/^http/, "ws")}/ws`);
    socket = current;

    current.onopen = () => {
      current.send(JSON.stringify({ type: "join", code, playerId: playerId() }));
      outbox.splice(0).forEach((message) => current.send(message));
    };
    current.onmessage = ({ data }) => listeners.forEach((listener) => listener(JSON.parse(data)));
    // A dropped connection (a phone locking, the proxy timing out) comes back by itself while the room is open
    current.onclose = () => {
      if (socket === current && joinedCode === code) setTimeout(open, 1500);
    };
  };

  open();
};

export const leaveRoom = () => {
  joinedCode = undefined;
  outbox.length = 0;
  socket?.close();
  socket = undefined;
};

export const sendRoom = (message: object) => {
  const text = JSON.stringify(message);
  if (socket?.readyState === WebSocket.OPEN) return socket.send(text);

  outbox.push(text);
};

export const onRoomMessage = (listener: (message: RoomMessage) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
