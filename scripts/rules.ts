import { buildBoard, getGameResult } from "../src/utils/board";

// Declared locally so the build does not depend on @types/node resolving
declare const process: { argv: string[]; exit(code: number): void };

const cases = [
  { name: "Fool's mate", fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3", reason: "checkmate", winner: "black" },
  { name: "Scholar's mate", fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4", reason: "checkmate", winner: "white" },
  { name: "Back rank mate", fen: "6k1/5ppp/8/8/8/8/8/R5K1 b - - 0 1", reason: "", winner: null },
  { name: "Queen stalemate", fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", reason: "stalemate", winner: null },
  { name: "Corner stalemate", fen: "k7/P7/K7/8/8/8/8/8 b - - 0 1", reason: "stalemate", winner: null },
  { name: "King vs king", fen: "8/8/8/4k3/8/8/4K3/8 w - - 0 1", reason: "insufficient material", winner: null },
  { name: "King and bishop vs king", fen: "8/8/8/4k3/8/8/4KB2/8 w - - 0 1", reason: "insufficient material", winner: null },
  { name: "King and knight vs king", fen: "8/8/8/4k3/8/8/4KN2/8 w - - 0 1", reason: "insufficient material", winner: null },
  { name: "Same coloured bishops", fen: "5b2/8/8/4k3/8/8/4K3/2B5 w - - 0 1", reason: "insufficient material", winner: null },
  { name: "Opposite coloured bishops", fen: "4b3/8/8/4k3/8/8/4K3/2B5 w - - 0 1", reason: "", winner: null },
  { name: "Two knights is playable", fen: "8/8/8/4k3/8/8/4KNN1/8 w - - 0 1", reason: "", winner: null },
  { name: "Fifty move rule", fen: "8/8/4k3/8/8/4K3/8/4R3 w - - 100 80", reason: "fifty move rule", winner: null },
  { name: "Ongoing game", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", reason: "", winner: null },
];

let failures = 0;

for (const testCase of cases) {
  const result = getGameResult(buildBoard({ fen: testCase.fen }));
  const passed = result.reason === testCase.reason && result.winner === testCase.winner;

  if (!passed) failures++;
  console.log(`  ${passed ? "ok  " : "FAIL"} ${testCase.name}: ${result.reason || "playable"}${result.winner ? ` (${result.winner})` : ""}`);
}

// Threefold needs the same position reaching the history three times
const repeated = buildBoard({ fen: "8/8/4k3/8/8/4K3/8/4R3 w - - 0 1" });
const key = repeated.fen.split(" ").slice(0, 4).join(" ");
const threefold = getGameResult(repeated, [key, key, key]);

if (threefold.reason !== "threefold repetition") failures++;
console.log(`  ${threefold.reason === "threefold repetition" ? "ok  " : "FAIL"} Threefold repetition: ${threefold.reason || "playable"}`);

console.log(failures === 0 ? "\nAll rule checks pass.\n" : `\n${failures} rule check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
