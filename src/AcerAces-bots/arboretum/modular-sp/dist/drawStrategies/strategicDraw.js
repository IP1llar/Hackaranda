import { drawingMove } from '../types.js';
import { analyzeHand, getMostCommonSpecies, shouldAccelerateGame } from '../helpers.js';
export function strategicDraw(state) {
    // Strategy #6: Accelerate game if in good position
    if (shouldAccelerateGame(state) && state.deck > 0) {
        return drawingMove.Deck; // Draw from deck to end game faster
    }
    // Strategy #2: Access hand for potential high-scoring trees
    const handAnalysis = analyzeHand(state.hand, state.playArea);
    const mostCommonSpecies = getMostCommonSpecies(state.hand);
    // Look for cards of our most common species in discard piles
    if (state.discard.length > 0) {
        const topDiscard = state.discard[state.discard.length - 1];
        if (topDiscard[0] === mostCommonSpecies) {
            return drawingMove.OwnDiscard; // Draw from our discard
        }
    }
    if (state.opponentDiscard.length > 0) {
        const topOpponentDiscard = state.opponentDiscard[state.opponentDiscard.length - 1];
        if (topOpponentDiscard[0] === mostCommonSpecies) {
            return drawingMove.OpponentDiscard; // Draw from opponent's discard
        }
    }
    // Strategy #1: Build initial mixed structure - prefer deck for variety
    if (state.deck > 0) {
        return drawingMove.Deck; // Draw from deck for variety
    }
    // Fallback: random choice from available options
    const options = [];
    if (state.deck > 0) {
        options.push(drawingMove.Deck);
    }
    if (state.discard.length > 0) {
        options.push(drawingMove.OwnDiscard);
    }
    if (state.opponentDiscard.length > 0) {
        options.push(drawingMove.OpponentDiscard);
    }
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}
//# sourceMappingURL=strategicDraw.js.map