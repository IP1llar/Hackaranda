export type playerState<move> = {
  /** Cards remaining in deck */
  deck: number;
  /** Player's hand */
  hand: Hand;
  /** Opponent's hand */
  opponentHand: opponentHand;
  /** Player's Discard Pile */
  discard: Discard;
  /** Opponent's Discard Pile*/
  opponentDiscard: Discard;
  /** play area */
  playArea: playArea;
  /** Opponent's play area */
  opponentPlayArea: playArea;
  /** Current turn */
  turn: turn;
  /** Current sub turn */
  subTurn: subTurn;
  /** Is player active */
  activeTurn: boolean;
  previousTurn: { move: move | false; metaData: Card | false };
  showPreviousTurn: boolean;
  /** Strategy memory for stateful strategies */
  memory?: StrategyMemory;
};

export type species = "J" | "R" | "C" | "M" | "O" | "W";
export const species: species[] = ["J", "R", "C", "M", "O", "W"];
export type rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const ranks: rank[] = [1, 2, 3, 4, 5, 6, 7, 8];
export type Card = [species, rank];
export type Deck = Card[];
export type path = Card[];
export type Hand = Deck;
export type opponentHand = (Card | null)[];
export type Discard = Deck;

/**
 * Arboretum play area. Grid from playArea.x.y is the Card at (x, y).
 */
export type playArea = Record<number, Record<number, Card>>;
export type coord = [number, number];

export type turn = number;
export enum subTurn {
  FirstDraw,
  SecondDraw,
  Play,
  Discard,
}
export enum drawingMove {
  Deck,
  OwnDiscard,
  OpponentDiscard,
}

export type playMove = {
  card: Card;
  coord: [number, number];
};

export type discardMove = Card;

export type move = drawingMove | playMove | discardMove;

// Strategy memory for stateful strategies
export type StrategyMemory = {
  gamePhase?: 'early' | 'mid' | 'late';
  preferredSpecies?: species[];
  opponentPatterns?: {
    aggressive?: boolean;
    defensive?: boolean;
    speciesFocus?: species[];
  };
  lastMoves?: {
    draw?: drawingMove;
    play?: playMove;
    discard?: discardMove;
  };
  [key: string]: any; // Allow custom memory fields
}; 