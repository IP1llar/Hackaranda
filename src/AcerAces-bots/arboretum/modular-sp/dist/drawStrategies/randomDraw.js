import { drawingMove } from '../types.js';
export function randomDraw(state) {
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
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}
//# sourceMappingURL=randomDraw.js.map