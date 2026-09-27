export const THEMES = {
  charcoal: { label: "Charcoal" },
  blue: { label: "Blue" },
};

export type Theme = keyof typeof THEMES;

export const LAYOUTS = {
  studio: { label: "Studio" },
  immersive: { label: "Immersive" },
};

export type Layout = keyof typeof LAYOUTS;

// Square colours live in styles/tokens.css under [data-board="<key>"].
export const BOARD_THEMES = {
  classic: { label: "Classic" },
  forest: { label: "Forest" },
  ocean: { label: "Ocean" },
  slate: { label: "Slate" },
};

export type BoardTheme = keyof typeof BOARD_THEMES;

// Each set is public/pieces/<key>/wK.svg … bP.svg; docs/piece_sets.html previews more to add.
export const PIECE_SETS = {
  neo: { label: "Neo" },
  staunty: { label: "Modern" },
  cburnett: { label: "Classic" },
  cardinal: { label: "Bold" },
  fresca: { label: "Minimal" },
};

export type PieceSet = keyof typeof PIECE_SETS;

// Stockfish's Skill Level (0–20) and search depth.
export const DIFFICULTIES = {
  easy: { label: "Easy", skill: 0, depth: 4 },
  medium: { label: "Medium", skill: 8, depth: 8 },
  hard: { label: "Hard", skill: 20, depth: 12 },
};

export type Difficulty = keyof typeof DIFFICULTIES;

export const TIME_CONTROLS = {
  "1+1": { minutes: 1, increment: 1 },
  "3+0": { minutes: 3, increment: 0 },
  "3+2": { minutes: 3, increment: 2 },
  "5+0": { minutes: 5, increment: 0 },
  "10+0": { minutes: 10, increment: 0 },
  "15+10": { minutes: 15, increment: 10 },
};

export type TimeControl = keyof typeof TIME_CONTROLS;

const PIECE_LETTERS: Record<string, string> = { king: "K", queen: "Q", rook: "R", bishop: "B", knight: "N", pawn: "P" };

export const pieceSrc = (pieceSet: PieceSet, color: string | null, type: string) => `/pieces/${pieceSet}/${color?.[0]}${PIECE_LETTERS[type]}.svg`;
