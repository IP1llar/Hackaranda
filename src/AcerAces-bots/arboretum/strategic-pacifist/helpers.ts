import type { Card, coord, path, playArea, species, Hand, opponentHand } from './types.js';

// Species types
export const SPECIES: species[] = ['J', 'R', 'C', 'M', 'O', 'W'];

// Card string representation for comparison
export function cardString(card: Card): string {
	return `${card[0]}${card[1]}`;
}

// Get all empty spaces adjacent to played cards
export function getAllEmptySpaces(playArea: playArea): coord[] {
	const toView: coord[] = [[0, 0]];
	const visitedCards = new Set<string>();
	const emptySpaces: coord[] = [];
	
	while (toView.length) {
		const [x, y] = toView.pop()!;
		const card = playArea[x]?.[y];
		if (card === undefined) {
			return [[x, y]];
		}
		visitedCards.add(cardString(card));

		const coordOptions: coord[] = [
			[x, y + 1],
			[x, y - 1],
			[x + 1, y],
			[x - 1, y],
		];
		
		for (let [x, y] of coordOptions) {
			const card = playArea[x]?.[y];
			if (card === undefined) {
				emptySpaces.push([x, y]);
				continue;
			}
			if (visitedCards.has(cardString(card))) {
				continue;
			}
			toView.push([x, y]);
		}
	}
	return emptySpaces;
}

// Place a card in play area and return new play area
export function placeCardInPlayArea(playArea: playArea, newCard: Card, newX: number, newY: number): playArea {
	const newPlayArea: playArea = {};
	for (let x of Object.keys(playArea)) {
		const row = playArea[Number(x)]!;
		for (let y of Object.keys(row)) {
			const card = row[Number(y)]!;
			playAreaInsert(newPlayArea, card, Number(x), Number(y));
		}
	}
	playAreaInsert(newPlayArea, newCard, newX, newY);
	return newPlayArea;
}

function playAreaInsert(playArea: playArea, card: Card, x: number, y: number): void {
	const row = playArea[x];
	if (row == undefined) {
		playArea[x] = {};
	}
	playArea[x]![y] = card;
}

// Analyze hand for potential high-scoring species
export function analyzeHand(hand: Hand): Record<species, {
	count: number;
	totalRank: number;
	has1: boolean;
	has8: boolean;
	score: number;
	ranks: number[];
}> {
	const speciesCount: Record<species, number> = {
		J: 0, R: 0, C: 0, M: 0, O: 0, W: 0
	};
	const speciesRanks: Record<species, number[]> = {
		J: [], R: [], C: [], M: [], O: [], W: []
	};
	
	for (const card of hand) {
		const [species, rank] = card;
		speciesCount[species]++;
		speciesRanks[species].push(rank);
	}
	
	// Calculate potential scores for each species
	const speciesScores: Record<species, {
		count: number;
		totalRank: number;
		has1: boolean;
		has8: boolean;
		score: number;
		ranks: number[];
	}> = {} as any;
	
	for (const species of SPECIES) {
		const ranks = speciesRanks[species];
		const totalRank = ranks.reduce((sum, rank) => sum + rank, 0);
		const has1 = ranks.includes(1);
		const has8 = ranks.includes(8);
		
		// Basic scoring potential
		let score = totalRank;
		if (has1) score += 1;
		if (has8) score += 2;
		
		speciesScores[species] = {
			count: speciesCount[species],
			totalRank,
			has1,
			has8,
			score,
			ranks
		};
	}
	
	return speciesScores;
}

// Check if opponent has 1s that would nullify 8s
export function checkOpponentOnes(opponentHand: opponentHand): Set<species> {
	const opponentOnes = new Set<species>();
	for (const card of opponentHand) {
		if (card && card[1] === 1) {
			opponentOnes.add(card[0]);
		}
	}
	return opponentOnes;
}

// Categorize cards into save vs play groups
export function categorizeCards(hand: Hand, opponentHand: opponentHand, playArea: playArea): {
	saveCards: Card[];
	playCards: Card[];
	saveSpecies: species[];
} {
	const handAnalysis = analyzeHand(hand);
	const opponentOnes = checkOpponentOnes(opponentHand);
	
	const saveCards: Card[] = [];
	const playCards: Card[] = [];
	
	// Sort species by scoring potential
	const sortedSpecies = Object.entries(handAnalysis)
		.sort((a, b) => b[1].score - a[1].score);
	
	// Keep top 2 species for saving (strategy #3)
	const saveSpecies = sortedSpecies.slice(0, 2).map(([species]) => species as species);
	
	for (const card of hand) {
		const [species, rank] = card;
		const isSaveSpecies = saveSpecies.includes(species);
		const opponentHasOne = opponentOnes.has(species);
		
		// Strategy #4: If opponent has 1, 8 is useless as save card
		if (rank === 8 && opponentHasOne) {
			playCards.push(card);
		}
		// Strategy #3: Balance save cards (max 2 species)
		else if (isSaveSpecies && saveCards.filter(c => c[0] === species).length < 2) {
			saveCards.push(card);
		}
		else {
			playCards.push(card);
		}
	}
	
	return { saveCards, playCards, saveSpecies };
}

// Calculate current game position score
export function calculatePositionScore(playArea: playArea, hand: Hand, opponentHand: opponentHand): number {
	let totalScore = 0;
	
	// Calculate current play area score
	for (const species of SPECIES) {
		const [score] = scorePlayArea(playArea, species);
		totalScore += score;
	}
	
	// Add potential hand score
	const handAnalysis = analyzeHand(hand);
	for (const species of SPECIES) {
		const analysis = handAnalysis[species];
		if (analysis && analysis.count > 0) {
			totalScore += analysis.score * 0.5; // Weight hand potential
		}
	}
	
	return totalScore;
}

// Check if we're in a good position to accelerate the game
export function shouldAccelerateGame(state: {
	playArea: playArea;
	hand: Hand;
	opponentHand: opponentHand;
	opponentPlayArea: playArea;
}): boolean {
	const ourScore = calculatePositionScore(state.playArea, state.hand, state.opponentHand);
	const opponentScore = calculatePositionScore(state.opponentPlayArea, state.opponentHand.filter(card => card !== null) as Hand, state.hand);
	
	// Strategy #6: Accelerate if we're ahead
	return ourScore > opponentScore;
}

// Basic scoring function (simplified version)
export function scorePlayArea(playArea: playArea, species: species): [number, path[]] {
	// This is a simplified scoring - in practice you'd want the full path-finding algorithm
	let score = 0;
	
	// Count cards of this species in play area
	for (const x of Object.keys(playArea)) {
		const row = playArea[Number(x)]!;
		for (const y of Object.keys(row)) {
			const card = row[Number(y)]!;
			if (card[0] === species) {
				score += card[1]; // Basic score based on rank
			}
		}
	}
	
	return [score, []];
}

// Get most common species in hand
export function getMostCommonSpecies(hand: Hand): species {
	const speciesCount: Record<species, number> = {
		J: 0, R: 0, C: 0, M: 0, O: 0, W: 0
	};
	
	for (const card of hand) {
		const species = card[0];
		speciesCount[species]++;
	}
	
	let mostCommon: species = 'J';
	let maxCount = 0;
	for (const [species, count] of Object.entries(speciesCount)) {
		if (count > maxCount) {
			maxCount = count;
			mostCommon = species as species;
		}
	}
	
	return mostCommon;
} 