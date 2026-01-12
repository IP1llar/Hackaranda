import { 
	categorizeCards, 
	getAllEmptySpaces, 
	placeCardInPlayArea, 
	scorePlayArea,
	SPECIES,
	canBuildRainbowStaircase,
	getStaircaseTargets,
	findStaircaseCard,
	findStaircaseCardHigh
} from './helpers.js';
import type { playerState, move, playMove, Card, coord, playArea } from './types.js';

export function playMove(state: playerState<move>): playMove {
	// Strategy #1: Build initial mixed structure
	if (state.playArea[0]?.[0] === undefined) {
		// First play - choose a balanced card for mixed structure
		const { playCards } = categorizeCards(state.hand, state.opponentHand, state.playArea);
		
		// Prefer middle-ranked cards for initial placement
		const sortedCards = playCards.sort((a, b) => Math.abs(a[1] - 4.5) - Math.abs(b[1] - 4.5));
		return { card: sortedCards[0]!, coord: [0, 0] };
	}
	
	// NEW: Try rainbow staircase approach first
	const staircaseMove = tryRainbowStaircase(state);
	if (staircaseMove) {
		return staircaseMove;
	}
	
	// Strategy #3: Use categorized cards
	const { playCards, saveCards } = categorizeCards(state.hand, state.opponentHand, state.playArea);
	
	// Prefer play cards, but use save cards if no good play cards available
	const availableCards = playCards.length > 0 ? playCards : saveCards;
	
	const emptySpaces = getAllEmptySpaces(state.playArea);
	if (emptySpaces.length === 0) {
		// Fallback if no empty spaces found
		return { card: state.hand[0]!, coord: [0, 0] };
	}
	
	let bestCard = availableCards[0]!;
	let bestCoord = emptySpaces[0]!;
	let bestScore = -Infinity;
	
	// Safety check: ensure we have valid cards and coordinates
	if (availableCards.length === 0) {
		return { card: state.hand[0]!, coord: emptySpaces[0]! };
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

// Try to build rainbow staircase (inspired by decent bot)
function tryRainbowStaircase(state: playerState<move>): playMove | null {
	if (!canBuildRainbowStaircase(state.playArea)) {
		return null;
	}

	const { lowTarget, highTarget, lowCoord, highCoord } = getStaircaseTargets(state.playArea);
	
	// Don't extend too far beyond 1-8 range
	if (lowTarget < 1 && highTarget > 8) {
		return null;
	}

	const { playCards, saveCards } = categorizeCards(state.hand, state.opponentHand, state.playArea);
	const availableCards = playCards.length > 0 ? playCards : saveCards;

	if (availableCards.length === 0) {
		return null;
	}

	// Try to extend the low end
	if (lowTarget >= 1 && lowCoord) {
		// Check if the target coordinate is actually empty
		if (state.playArea[lowCoord[0]]?.[lowCoord[1]] === undefined) {
			const lowCard = findStaircaseCard(availableCards, lowTarget);
			if (lowCard && lowTarget - lowCard[1] <= 2) {
				return { card: lowCard, coord: lowCoord };
			}
		}
	}

	// Try to extend the high end
	if (highTarget <= 8 && highCoord) {
		// Check if the target coordinate is actually empty
		if (state.playArea[highCoord[0]]?.[highCoord[1]] === undefined) {
			const highCard = findStaircaseCardHigh(availableCards, highTarget);
			if (highCard && highCard[1] - highTarget <= 2) {
				return { card: highCard, coord: highCoord };
			}
		}
	}

	return null;
}

// Calculate penalty for blocking potential single-species paths
function calculateBlockingPenalty(playArea: playArea, placedCard: Card, coord: coord): number {
	let penalty = 0;
	const [x, y] = coord;
	const cardSpecies = placedCard[0];
	
	// Check adjacent cards to see if we're blocking a potential single-species path
	const adjacentCoords: coord[] = [
		[x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y]
	];
	
	for (const [adjX, adjY] of adjacentCoords) {
		const adjacentCard = playArea[adjX]?.[adjY];
		if (adjacentCard && adjacentCard[0] === cardSpecies) {
			// We're adjacent to same species - this is good, reduce penalty
			penalty -= 2;
		} else if (adjacentCard && adjacentCard[0] !== cardSpecies) {
			// We're adjacent to different species - this might block a path
			penalty += 1;
		}
	}
	
	return penalty;
} 