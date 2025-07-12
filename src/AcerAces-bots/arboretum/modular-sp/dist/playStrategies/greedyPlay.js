import { getAllEmptySpaces, placeCardInPlayArea, scorePlayArea, SPECIES } from '../helpers.js';
export function greedyPlay(state) {
    // First play - choose highest value card
    if (state.playArea[0]?.[0] === undefined) {
        const sortedCards = state.hand.sort((a, b) => b[1] - a[1]);
        return { card: sortedCards[0], coord: [0, 0] };
    }
    const emptySpaces = getAllEmptySpaces(state.playArea);
    if (emptySpaces.length === 0) {
        return { card: state.hand[0], coord: [0, 0] };
    }
    let bestCard = state.hand[0];
    let bestCoord = emptySpaces[0];
    let bestScore = -Infinity;
    // Try every card in every position to find the highest immediate score
    for (const card of state.hand) {
        for (const coord of emptySpaces) {
            const newPlayArea = placeCardInPlayArea(state.playArea, card, coord[0], coord[1]);
            // Calculate total score improvement
            let totalScore = 0;
            for (const species of SPECIES) {
                const [score] = scorePlayArea(newPlayArea, species);
                totalScore += score;
            }
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestCard = card;
                bestCoord = coord;
            }
        }
    }
    return { card: bestCard, coord: bestCoord };
}
//# sourceMappingURL=greedyPlay.js.map