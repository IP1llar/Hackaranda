export function safeDiscard(state) {
    // Simple strategy: discard the lowest value card
    const sortedCards = state.hand.sort((a, b) => a[1] - b[1]);
    return sortedCards[0];
}
//# sourceMappingURL=safeDiscard.js.map