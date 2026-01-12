import type { playerState, move } from '../types.js';

export function safeDiscard(state: playerState<move>): move {
	// Simple strategy: discard the lowest value card
	const sortedCards = state.hand.sort((a, b) => a[1] - b[1]);
	return sortedCards[0]!;
} 