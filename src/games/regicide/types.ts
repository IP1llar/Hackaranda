export type Suit = "Hearts" | "Diamonds" | "Clubs" | "Spades";
export const Suits: Suit[] = ["Hearts", "Diamonds", "Clubs", "Spades"];

export type Value = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export const Values: Value[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export type Card = {
    suit: Suit | "Joker";
    value: Value | 0; // 0 for Joker
};

export type Deck = Card[];

export type GridPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type RoyalStats = {
    health: number;
    armour: number;
};

export type RegicideState = {
    deck: Card[];
    grid: Card[][]; // 9 stacks
    ploys: Card[]; // Aces and Jokers held by player
    deadRoyals: Card[];
    activeRoyals: (Card | null)[]; // 12 positions around the grid
    royalStats: Record<string, RoyalStats>; // Key: "${suit}-${value}"
    currentCard: Card | null; // Card drawn but not yet placed
    discard: Card[]; // Cards discarded/killed

    // Engine required fields
    turn: number;
    currentPlayer: number;
    opponent: string;
    playBack: boolean;
    previousTurn: false | Move;
};

export type MoveType = "PLACE" | "PLOY" | "ARMOUR" | "DISCARD";

export type PlaceMove = {
    type: "PLACE";
    position: GridPosition;
};

export type PloyMove = {
    type: "PLOY";
    card: Card; // The Ace or Joker used
    action: "REMOVE" | "MOVE";
    target: GridPosition; // Stack to remove or move from
    destination?: GridPosition; // Destination for move (Joker)
};

export type ArmourMove = {
    type: "ARMOUR";
    targetRoyal: Card;
};

export type DiscardMove = {
    type: "DISCARD";
    cards: Card[];
};

export type Move = PlaceMove | PloyMove | ArmourMove | DiscardMove;

export type PlayerState = {
    // Regicide specific
    grid: Card[][];
    ploys: Card[];
    deadRoyals: Card[];
    activeRoyals: (Card | null)[];
    currentCard: Card | null;
    royalStats: Record<string, RoyalStats>; // Map converted to object for JSON serialization

    // Engine required
    activeTurn: boolean;
    previousTurn: { move: Move | false };
    showPreviousTurn: boolean;
    opponent: string;
};

export type UserMove = string; // We'll parse string commands for now
