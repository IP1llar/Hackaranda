import { categorizeCards, getAllEmptySpaces, placeCardInPlayArea, scorePlayArea, SPECIES } from '../helpers.js';
export function strategicPlay(state) {
    // Strategy #1: Build initial mixed structure
    if (state.playArea[0]?.[0] === undefined) {
        // First play - choose a balanced card for mixed structure
        const { playCards } = categorizeCards(state.hand, state.opponentHand, state.playArea);
        // Prefer middle-ranked cards for initial placement
        const sortedCards = playCards.sort((a, b) => Math.abs(a[1] - 4.5) - Math.abs(b[1] - 4.5));
        return { card: sortedCards[0], coord: [0, 0] };
    }
    // Strategy #3: Use categorized cards
    const { playCards, saveCards } = categorizeCards(state.hand, state.opponentHand, state.playArea);
    // Prefer play cards, but use save cards if no good play cards available
    const availableCards = playCards.length > 0 ? playCards : saveCards;
    const emptySpaces = getAllEmptySpaces(state.playArea);
    if (emptySpaces.length === 0) {
        // Fallback if no empty spaces found
        return { card: state.hand[0], coord: [0, 0] };
    }
    let bestCard = availableCards[0];
    let bestCoord = emptySpaces[0];
    let bestScore = -Infinity;
    // Safety check: ensure we have valid cards and coordinates
    if (availableCards.length === 0) {
        return { card: state.hand[0], coord: emptySpaces[0] };
    }
    // Strategy #5: Don't block single-species paths
    for (const card of availableCards) {
        for (const coord of emptySpaces) {
            const newPlayArea = placeCardInPlayArea(state.playArea, card, coord[0], coord[1]);
            // Calculate total score improvement
            let totalScore = 0;
            for (const species of SPECIES) {
                const [score] = scorePlayArea(newPlayArea, species);
                totalScore += score;
            }
            // Bonus for not blocking potential single-species paths
            const blockingPenalty = calculateBlockingPenalty(newPlayArea, card, coord);
            const adjustedScore = totalScore - blockingPenalty;
            if (adjustedScore > bestScore) {
                bestScore = adjustedScore;
                bestCard = card;
                bestCoord = coord;
            }
        }
    }
    return { card: bestCard, coord: bestCoord };
}
// Calculate penalty for blocking potential single-species paths
function calculateBlockingPenalty(playArea, placedCard, coord) {
    let penalty = 0;
    const [x, y] = coord;
    const cardSpecies = placedCard[0];
    // Check adjacent cards to see if we're blocking a potential single-species path
    const adjacentCoords = [
        [x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y]
    ];
    for (const [adjX, adjY] of adjacentCoords) {
        const adjacentCard = playArea[adjX]?.[adjY];
        if (adjacentCard && adjacentCard[0] === cardSpecies) {
            // We're adjacent to same species - this is good, reduce penalty
            penalty -= 2;
        }
        else if (adjacentCard && adjacentCard[0] !== cardSpecies) {
            // We're adjacent to different species - this might block a path
            penalty += 1;
        }
    }
    return penalty;
}
//# sourceMappingURL=strategicPlay.js.map