import type { gameInterface, winner } from "../types.js";
import type { identifier } from "../../turnHandlers/botHandler/index.js";
import { createDeck, isRoyal, isAce, isJoker, getCardValue, getAttackValue, getRoyalHealth, canAttack, shuffle } from "./logic.js";
import type { Card, RegicideState, Move, PlayerState, UserMove, GridPosition, RoyalStats } from "./types.js";

// Helper to get initial state
function getInitialGameState(): RegicideState {
    const deck = createDeck();
    const grid: Card[][] = [[], [], [], [], [], [], [], [], []];
    const ploys: Card[] = [];
    const deadRoyals: Card[] = [];
    const royalStats: Record<string, RoyalStats> = {};

    // Setup grid
    // "Draw cards from the top and lay them out face-up in a 3×3 grid."
    // "If you draw any royals, aces or jokers... put them on a separate pile... keep drawing"

    let gridFilled = 0;
    const tempPloysAndRoyals: Card[] = [];

    while (gridFilled < 9 && deck.length > 0) {
        const card = deck.shift();
        if (!card) break; // Should not happen given loop condition
        if (isRoyal(card) || isAce(card) || isJoker(card)) {
            tempPloysAndRoyals.push(card);
        } else {
            const stack = grid[gridFilled];
            if (stack) {
                stack.push(card);
                gridFilled++;
            }
        }
    }

    // "If you did draw some royals, you now place them... adjacent to the grid card it’s most similar to"
    // "Any aces and jokers you drew... keep them face-up to one side. These are Ploys"

    const activeRoyals: (Card | null)[] = [];
    for (const card of tempPloysAndRoyals) {
        if (isAce(card) || isJoker(card)) {
            ploys.push(card);
        } else {
            activeRoyals.push(card);
        }
    }

    // "Once you have a 3x3 grid... you may choose one to replace" -> Skip for now.

    const state: RegicideState = {
        deck,
        grid,
        ploys,
        deadRoyals,
        activeRoyals, // Populated from setup
        royalStats,
        currentCard: null,
        discard: [],
        turn: 1,
        currentPlayer: 0,
        opponent: "bot",
        playBack: false,
        previousTurn: false
    };

    // Draw first card
    if (state.deck.length > 0) {
        let drawnCard = state.deck.shift();
        while (drawnCard) {
            if (isRoyal(drawnCard)) {
                state.activeRoyals.push(drawnCard);
                drawnCard = state.deck.shift();
            } else if (isAce(drawnCard) || isJoker(drawnCard)) {
                state.ploys.push(drawnCard);
                drawnCard = state.deck.shift();
            } else {
                state.currentCard = drawnCard;
                break;
            }
        }
    }

    return state;
}

function gameOver(gameState: RegicideState): boolean {
    // Win: 12 dead royals
    if (gameState.deadRoyals.length >= 12) return true;

    // Loss: Deck empty AND no moves possible?
    // "If the draw pile runs out: and you haven’t killed all the royals... if you’re out of both cards and ploys... you’ve lost."
    if (gameState.deck.length === 0 && gameState.currentCard === null && gameState.ploys.length === 0) {
        // Check if any moves possible on grid?
        // Actually, if deck is empty, we can't draw.
        // If we have no current card, we can't place.
        // If we have no ploys, we can't change anything.
        // So yes, lost.
        return true;
    }

    return false;
}

function getWinner(gameState: RegicideState): winner<string> {
    if (gameState.deadRoyals.length >= 12) {
        return { result: 1, metaData: "Win", scoreA: 1, scoreB: 0 };
    }
    return { result: 2, metaData: "Loss", scoreA: 0, scoreB: 1 };
}

function isValidMove(gameState: RegicideState, move: Move): boolean {
    if (move.type === "PLACE") {
        if (gameState.currentCard === null) return false; // Must have drawn a card
        const stack = gameState.grid[move.position];
        if (!stack) return false;
        // Rule: "It can go on any card with the same or lower value"
        if (stack.length === 0) return true;
        const topCard = stack[stack.length - 1];
        if (!topCard) return true;
        return gameState.currentCard.value <= topCard.value;
    }

    if (move.type === "PLOY") {
        // Check if player has the ploy card
        const hasPloy = gameState.ploys.some(p => p.suit === move.card.suit && p.value === move.card.value);
        if (!hasPloy) return false;

        if (isAce(move.card)) {
            // Extraction: Pick up one stack
            const targetStack = gameState.grid[move.target];
            return !!targetStack && targetStack.length > 0;
        }
        if (isJoker(move.card)) {
            // Reassignment: Move top card
            const sourceStack = gameState.grid[move.target];
            if (!sourceStack || sourceStack.length === 0) return false;
            if (move.destination === undefined) return false;

            const destStack = gameState.grid[move.destination];
            if (!destStack) return false;

            // Must be valid placement at destination
            const cardToMove = sourceStack[sourceStack.length - 1];
            if (!cardToMove) return false;

            if (destStack.length === 0) return true;
            const destTop = destStack[destStack.length - 1];
            if (!destTop) return true;

            return cardToMove.value <= destTop.value;
        }
    }

    if (move.type === "ARMOUR") {
        // Must have current card
        if (gameState.currentCard === null) return false;
        // Target royal must be alive (in activeRoyals or just not dead?)
        // We track deadRoyals.
        // But we also need to know if the royal is actually on the board?
        // For now, assume we can armour any royal that isn't dead?
        // Rules: "add the card as Armour to the royal it’s most similar to"
        // The move should probably just specify "ARMOUR", and the engine decides WHICH royal?
        // Or the user specifies?
        // Let's say user specifies for now, but validation checks if it's a valid target.
        return true; // Simplified
    }

    if (move.type === "DISCARD") {
        // Only allowed if no other moves?
        // Rules: "If you cannot place a card: and you have no Ploys... you must add the card as Armour"
        // So DISCARD isn't really a move, it's ARMOUR.
        // But if we can't armour (e.g. all royals dead? then we won).
        // If we can't place and have no ploys, we MUST armour.
        // So explicit DISCARD might not be needed if ARMOUR covers "bad" plays.
        return false;
    }

    return false;
}

function applyMove(gameState: RegicideState, move: Move): RegicideState {
    const newState = { ...gameState, grid: [...gameState.grid], ploys: [...gameState.ploys], deadRoyals: [...gameState.deadRoyals], discard: [...gameState.discard] };

    if (move.type === "PLACE") {
        const stack = newState.grid[move.position];
        if (newState.currentCard && stack) {
            stack.push(newState.currentCard);
            newState.currentCard = null;

            // Check for attacks
            // "if you’re able to place a card on the grid opposite a royal – so there are two cards between"
            // This implies a specific spatial relationship.
            // 3x3 grid.
            // Royals are "outside".
            // Let's assume simplified attack:
            // If the stack is full (3 cards?), or just specific positions?
            // "opposite a royal"
            // If we assume royals are at specific slots, we check the line.
            // For now, let's just advance the turn.
        }
    }

    if (move.type === "PLOY") {
        // Remove ploy card from hand
        const ployIndex = newState.ploys.findIndex(p => p.suit === move.card.suit && p.value === move.card.value);
        if (ployIndex !== -1) {
            newState.ploys.splice(ployIndex, 1);
            // Add used ploy to discard or separate pile?
            // "Turn the ace face-down to remember you’ve used it."
            // Effectively removed from available ploys.
        }

        if (isAce(move.card)) {
            // Extraction
            const stack = newState.grid[move.target];
            if (stack) {
                // "pick up one stack... put them face-down at the bottom of your draw pile"
                newState.deck = [...newState.deck, ...stack];
                newState.grid[move.target] = [];
            }
        }

        if (isJoker(move.card)) {
            // Reassignment
            const sourceStack = newState.grid[move.target];
            const destStack = newState.grid[move.destination!];
            if (sourceStack && destStack) {
                const card = sourceStack.pop();
                if (card) {
                    destStack.push(card);
                }
            }
        }
    }

    if (move.type === "ARMOUR") {
        if (newState.currentCard) {
            // Add to royal stats
            const royalKey = `${move.targetRoyal.suit}-${move.targetRoyal.value}`;
            if (!newState.royalStats[royalKey]) {
                newState.royalStats[royalKey] = { health: getRoyalHealth(move.targetRoyal), armour: 0 };
            }
            newState.royalStats[royalKey].armour += newState.currentCard.value;
            newState.currentCard = null;
        }
    }

    // Draw new card if needed
    if (newState.currentCard === null && newState.deck.length > 0) {
        // Logic for drawing next card
        // "Draw the top card from the deck."
        // "If it’s a royal: use placement rule above."
        // "If it has value 2-10: you must place it"
        // "If it’s an ace or joker: keep it to one side"

        let drawnCard = newState.deck.shift();
        while (drawnCard) {
            if (isRoyal(drawnCard)) {
                // Place royal
                // For now, add to activeRoyals
                // Find empty slot?
                // Simplified: just push to activeRoyals list if not full?
                // Or just keep drawing?
                // "If you draw any royals... place them... keep drawing" (Setup)
                // During play: "Draw the top card... If it’s a royal: use placement rule above."
                // Does not say "keep drawing".
                // So the turn ends? Or we just place it and that's it?
                // "Draw the top card... If it’s a royal... If it has value 2-10... If it’s an ace..."
                // It seems drawing a royal is an event, but doesn't consume the "play" phase of placing a number card?
                // But the player can't do anything if a royal is drawn.
                // So effectively, the engine handles it.
                newState.activeRoyals.push(drawnCard);
                drawnCard = newState.deck.shift();
            } else if (isAce(drawnCard) || isJoker(drawnCard)) {
                newState.ploys.push(drawnCard);
                // "keep it to one side, see Ploys."
                // Does this end the turn?
                // "Draw the top card... If it's an ace... keep it... see Ploys."
                // It doesn't explicitly say draw again.
                // But if you don't have a number card, you can't place.
                // "If you cannot place a card... you must add the card as Armour"
                // But aces aren't placed.
                // Let's assume you keep drawing until you get a number card?
                // "Start with a shuffled deck... draw cards... keep drawing til you’ve made the grid" (Setup)
                // Play: "Draw the top card from the deck."
                // It doesn't say "keep drawing".
                // So if you draw an Ace, you just get an Ace and your turn (of placing) is skipped?
                // But you can use Ploys "at any time".
                // If you draw an Ace, you have no card to place.
                // So you just wait for next turn?
                // But single player...
                // Let's assume you draw until you get a playable card (2-10) or deck empty.
                drawnCard = newState.deck.shift();
            } else {
                newState.currentCard = drawnCard;
                break;
            }
        }
    }

    newState.previousTurn = move;
    return newState;
}

function getActivePlayerState(gameState: RegicideState): PlayerState {
    return {
        grid: gameState.grid,
        ploys: gameState.ploys,
        deadRoyals: gameState.deadRoyals,
        currentCard: gameState.currentCard,
        royalStats: gameState.royalStats,
        activeTurn: true,
        previousTurn: { move: gameState.previousTurn },
        showPreviousTurn: false,
        opponent: gameState.opponent
    };
}

function getInactivePlayerState(gameState: RegicideState): PlayerState {
    // Dummy player sees everything but can't act
    return getActivePlayerState(gameState);
}

export const regicide: gameInterface<
    RegicideState,
    RegicideState,
    UserMove,
    Move,
    PlayerState,
    string
> = {
    getInitialGameState: (initialState, playBack) => getInitialGameState(),
    players: 2, // Engine requires 2, we simulate 1 + dummy
    gameOver,
    isValidMove,
    applyMove,
    getRandomMove: () => ({ type: "DISCARD", cards: [] }), // Dummy move
    getActivePlayerState,
    getInactivePlayerState,
    newGameMessage: (gameNumber, round) => ({ message: "NEWGAME", gameNumber, round }),
    postGameMessage: (result, scores, finalState) => ({
        message: "ENDGAME",
        result,
        score: scores[0],
        opponentScore: scores[1],
        finalState
    }),
    getWinner,
    displayForUser: () => { }, // Implement later
    showPreviousTurn: async () => { },
    userMoveMessage: () => "Your move",
    userMoveTranslate: (move) => ({ type: "DISCARD", cards: [] }), // Implement parser
    playerMoveValidator: () => () => true,
    showScore: () => { },
    defaultBotDetail: (num) => ({ dockerId: "", identifier: "Bot" })
};
