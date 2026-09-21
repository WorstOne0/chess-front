import { buildBoard } from "../src/utils/board";
import { perft, perftDivide } from "../src/utils/perft";

// Declared locally so the perft build does not depend on @types/node resolving
declare const process: { argv: string[]; exit(code: number): void };

// https://www.chessprogramming.org/Perft_Results
const suite = [
  {
    name: "Start position",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    expected: [20, 400, 8902, 197281, 4865609],
  },
  {
    name: "Kiwipete",
    fen: "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    expected: [48, 2039, 97862, 4085603],
  },
  {
    name: "Position 3",
    fen: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
    expected: [14, 191, 2812, 43238, 674624],
  },
  {
    name: "Position 4",
    fen: "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    expected: [6, 264, 9467, 422333],
  },
  {
    name: "Position 4 mirrored",
    fen: "r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1",
    expected: [6, 264, 9467, 422333],
  },
  {
    name: "Position 5",
    fen: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
    expected: [44, 1486, 62379, 2103487],
  },
  {
    name: "Position 6",
    fen: "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
    expected: [46, 2079, 89890, 3894594],
  },
];

const runDivide = (fen: string, depth: number) => {
  const counts = perftDivide(buildBoard({ fen }), depth);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  for (const move of Object.keys(counts).sort()) console.log(`${move}: ${counts[move]}`);
  console.log(`\nNodes searched: ${total}`);
};

const runSuite = (maxDepth: number) => {
  let failures = 0;

  for (const position of suite) {
    console.log(`\n${position.name}`);
    console.log(`  ${position.fen}`);

    for (let depth = 1; depth <= Math.min(maxDepth, position.expected.length); depth++) {
      const expected = position.expected[depth - 1];
      const started = Date.now();
      const nodes = perft(buildBoard({ fen: position.fen }), depth);
      const elapsed = Date.now() - started;

      const status = nodes === expected ? "ok  " : "FAIL";
      const rate = elapsed > 0 ? ` ${Math.round(nodes / elapsed)}k nps` : "";
      console.log(`  ${status} depth ${depth}: ${nodes} / ${expected} (${elapsed}ms${rate})`);

      if (nodes !== expected) {
        failures++;
        break;
      }
    }
  }

  console.log(failures === 0 ? "\nAll perft counts match.\n" : `\n${failures} position(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
};

const [first, second] = process.argv.slice(2);

if (first && first.includes("/")) runDivide(first, parseInt(second) || 1);
else runSuite(parseInt(first) || 4);
