let engine: Worker | undefined;
// The worker has one onmessage, so a search started mid-search would steal the first one's answer
let queue: Promise<unknown> = Promise.resolve();

// Created on first call: this module is also evaluated during SSR, where Worker does not exist
const search = (fen: string, { skill, depth }: { skill: number; depth: number }) =>
  new Promise<{ move: string; score: number }>((resolve, reject) => {
    engine ??= new Worker("/stockfish/stockfish-19-lite-single.js");
    let score = 0;

    engine.onerror = reject;
    engine.onmessage = ({ data }: MessageEvent<string>) => {
      const [, unit, value] = data.match(/ score (cp|mate) (-?\d+)/) ?? [];
      // Centipawns for the side to move; a forced mate counts as 100 pawns
      if (unit) score = unit === "cp" ? Number(value) : Math.sign(Number(value)) * 10000;
      if (data.startsWith("bestmove")) resolve({ move: data.split(" ")[1], score });
    };
    engine.postMessage(`setoption name Skill Level value ${skill}`);
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage(`go depth ${depth}`);
  });

export const bestMove = (fen: string, level: { skill: number; depth: number }) => {
  const result = queue.then(() => search(fen, level));
  queue = result.catch(() => undefined);
  return result;
};
