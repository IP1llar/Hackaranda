import type { Card, Deck } from "./types.js";
import { Suits, Values } from "./types.js";

export function createDeck(): Deck {
    const deck: Deck = [];
    for (const suit of Suits) {
        for (const value of Values) {
            deck.push({ suit, value });
        }
    }
    // Add 2 Jokers
    deck.push({ suit: "Joker", value: 0 });
    deck.push({ suit: "Joker", value: 0 });

    return shuffle(deck);
}

// Fisher-Yates shuffle
export function shuffle(deck: Deck): Deck {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = deck[i];
        if (temp && deck[j]) {
            deck[i] = deck[j]!;
            deck[j] = temp;
        }
    }
    return deck;
}

export function isRoyal(card: Card): boolean {
    return card.value >= 11; // J, Q, K
}

export function isAce(card: Card): boolean {
    return card.value === 1;
}

export function isJoker(card: Card): boolean {
    return card.suit === "Joker";
}

// We need to handle Jokers.
// Let's assume for now I'll update types to allow Value 0 for Joker or something.
// Or maybe Suit "Joker".

export function getCardValue(card: Card): number {
    return card.value;
}

export function getAttackValue(card1: Card, card2: Card): number {
    return card1.value + card2.value;
}

export function getRoyalHealth(card: Card): number {
    if (card.value === 11) return 11; // Jack
    if (card.value === 12) return 12; // Queen
    if (card.value === 13) return 13; // King
    return 0;
}

export function canAttack(royal: Card, attackCards: Card[]): boolean {
    // Jacks: Any suit
    if (royal.value === 11) return true;

    // Queens: Same colour
    if (royal.value === 12) {
        const royalColor = (royal.suit === 'Hearts' || royal.suit === 'Diamonds') ? 'Red' : 'Black';
        return attackCards.every(c => {
            const cardColor = (c.suit === 'Hearts' || c.suit === 'Diamonds') ? 'Red' : 'Black';
            return cardColor === royalColor;
        });
    }

    // Kings: Same suit
    if (royal.value === 13) {
        return attackCards.every(c => c.suit === royal.suit);
    }

    return false;
}

export function isValidPlacement(card: Card, targetStack: Card[]): boolean {
    if (targetStack.length === 0) return true;
    const topCard = targetStack[targetStack.length - 1];
    if (!topCard) return true; // Should not happen if length > 0
    return card.value <= topCard.value;
}

export function calculateAttack(grid: Card[][], royalPosition: number): number {
    // Logic to calculate attack damage from grid against a royal at a specific position
    // This depends on how we map royals to grid positions.
    return 0;
}
