import { drawingMove } from '../types.js';
import { analyzeHand, getMostCommonSpecies } from '../helpers.js';
export function adaptiveDraw(state) {
    // Initialize memory if needed
    if (!state.memory) {
        state.memory = {
            drawPattern: 'deck',
            consecutiveDeckDraws: 0,
            lastDrawSource: null
        };
    }
    const handAnalysis = analyzeHand(state.hand, state.playArea);
    const mostCommonSpecies = getMostCommonSpecies(state.hand);
    // Track draw pattern
    const currentDrawSource = state.memory.lastDrawSource;
    // Adaptive logic based on game state and previous draws
    if (state.deck > 0 && state.memory.consecutiveDeckDraws < 3) {
        // Prefer deck draws but limit consecutive draws
        state.memory.consecutiveDeckDraws++;
        state.memory.lastDrawSource = 'deck';
        return drawingMove.Deck;
    }
    // Look for valuable cards in discard piles
    if (state.discard.length > 0) {
        const topDiscard = state.discard[state.discard.length - 1];
        if (topDiscard[0] === mostCommonSpecies) {
            state.memory.consecutiveDeckDraws = 0;
            state.memory.lastDrawSource = 'own';
            return drawingMove.OwnDiscard;
        }
    }
    if (state.opponentDiscard.length > 0) {
        const topOpponentDiscard = state.opponentDiscard[state.opponentDiscard.length - 1];
        if (topOpponentDiscard[0] === mostCommonSpecies) {
            state.memory.consecutiveDeckDraws = 0;
            state.memory.lastDrawSource = 'opponent';
            return drawingMove.OpponentDiscard;
        }
    }
    // Fallback to available options
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
    if (options.length === 0) {
        return drawingMove.Deck; // Fallback
    }
    // Avoid repeating the same draw source too often
    const filteredOptions = options.filter(option => {
        if (currentDrawSource === 'deck' && option === drawingMove.Deck)
            return false;
        if (currentDrawSource === 'own' && option === drawingMove.OwnDiscard)
            return false;
        if (currentDrawSource === 'opponent' && option === drawingMove.OpponentDiscard)
            return false;
        return true;
    });
    const finalOptions = filteredOptions.length > 0 ? filteredOptions : options;
    const randomIndex = Math.floor(Math.random() * finalOptions.length);
    const selectedOption = finalOptions[randomIndex];
    // Update memory
    state.memory.lastDrawSource = selectedOption === drawingMove.Deck ? 'deck' :
        selectedOption === drawingMove.OwnDiscard ? 'own' : 'opponent';
    if (selectedOption === drawingMove.Deck) {
        state.memory.consecutiveDeckDraws++;
    }
    else {
        state.memory.consecutiveDeckDraws = 0;
    }
    return selectedOption;
}
//# sourceMappingURL=adaptiveDraw.js.map