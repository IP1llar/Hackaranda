import { categorizeCards, analyzeHand, checkOpponentOnes } from './helpers.js';
import type { playerState, move, discardMove, Card } from './types.js';

export function discardMove(state: playerState<move>): discardMove {
	// Strategy #3: Use categorized cards - prefer discarding from play cards
	const { playCards, saveCards } = categorizeCards(state.hand, state.opponentHand, state.playArea);
	
	// Strategy #4: Prioritize discarding 8s if opponent has 1s
	const opponentOnes = checkOpponentOnes(state.opponentHand);
	const uselessEights = state.hand.filter(card => 
		card[1] === 8 && opponentOnes.has(card[0])
	);
	
	if (uselessEights.length > 0) {
		// Discard the lowest-ranked useless 8
		return uselessEights.sort((a, b) => a[1] - b[1])[0]!;
	}
	
	// Prefer discarding from play cards over save cards
	const discardCandidates = playCards.length > 0 ? playCards : saveCards;
	
	// Strategy #2: Analyze hand for scoring potential (enhanced with play area)
	const handAnalysis = analyzeHand(discardCandidates, state.playArea);
	
	// Find the least valuable card to discard
	let worstCard = discardCandidates[0]!;
	let worstScore = Infinity;
	
	for (const card of discardCandidates) {
		const [species, rank] = card;
		const analysis = handAnalysis[species];
		
		// Calculate card value based on:
		// 1. Rank (higher is better)
		// 2. Whether it's part of a scoring species
		// 3. Special value of 1s and 8s
		let cardValue = rank;
		
		if (analysis) {
			// Bonus for being part of a species we have multiple cards of
			cardValue += analysis.count * 0.5;
			
			// Bonus for 1s and 8s (unless 8 is useless due to opponent's 1)
			if (rank === 1) cardValue += 2;
			if (rank === 8 && !opponentOnes.has(species)) cardValue += 3;
		}
		
		if (cardValue < worstScore) {
			worstScore = cardValue;
			worstCard = card;
		}
	}
	
	return worstCard;
} 