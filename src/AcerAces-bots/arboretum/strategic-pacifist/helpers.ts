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
			// If this is the first empty space and no cards have been placed yet
			if (Object.keys(playArea).length === 0) {
				return [[x, y]];
			}
			// Otherwise, this is an empty space adjacent to existing cards
			emptySpaces.push([x, y]);
			continue;
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
export function analyzeHand(hand: Hand, playArea?: playArea): Record<species, {
	count: number;
	totalRank: number;
	has1: boolean;
	has8: boolean;
	score: number;
	ranks: number[];
	currentPlayAreaScore: number;
	potentialScore: number;
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
		currentPlayAreaScore: number;
		potentialScore: number;
	}> = {} as any;
	
	for (const species of SPECIES) {
		const ranks = speciesRanks[species];
		const totalRank = ranks.reduce((sum, rank) => sum + rank, 0);
		const has1 = ranks.includes(1);
		const has8 = ranks.includes(8);
		
		// Current play area score for this species
		const currentPlayAreaScore = playArea ? scorePlayArea(playArea, species)[0] : 0;
		
		// Basic scoring potential
		let score = totalRank;
		if (has1) score += 1;
		if (has8) score += 2;
		
		// Enhanced potential score considering play area
		let potentialScore = score;
		if (playArea && currentPlayAreaScore > 0) {
			// Bonus for species that already have cards in play area
			potentialScore += currentPlayAreaScore * 0.5;
		}
		
		// Bonus for species with good rank distribution for path building
		if (ranks.length >= 2) {
			const sortedRanks = [...ranks].sort((a, b) => a - b);
			let consecutiveBonus = 0;
			for (let i = 0; i < sortedRanks.length - 1; i++) {
				if (sortedRanks[i + 1]! - sortedRanks[i]! === 1) {
					consecutiveBonus += 2; // Bonus for consecutive ranks
				}
			}
			potentialScore += consecutiveBonus;
		}
		
		speciesScores[species] = {
			count: speciesCount[species],
			totalRank,
			has1,
			has8,
			score,
			ranks,
			currentPlayAreaScore,
			potentialScore
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
	const handAnalysis = analyzeHand(hand, playArea);
	const opponentOnes = checkOpponentOnes(opponentHand);
	
	const saveCards: Card[] = [];
	const playCards: Card[] = [];
	
	// Sort species by enhanced potential score (considering play area)
	const sortedSpecies = Object.entries(handAnalysis)
		.sort((a, b) => b[1].potentialScore - a[1].potentialScore);
	
	// Keep top 2 species for saving (strategy #3)
	const saveSpecies = sortedSpecies.slice(0, 2).map(([species]) => species as species);
	
	for (const card of hand) {
		const [species, rank] = card;
		const isSaveSpecies = saveSpecies.includes(species);
		const opponentHasOne = opponentOnes.has(species);
		const analysis = handAnalysis[species];
		
		// Strategy #4: If opponent has 1, 8 is useless as save card
		if (rank === 8 && opponentHasOne) {
			playCards.push(card);
		}
		// Strategy #3: Balance save cards (max 2 species)
		else if (isSaveSpecies && saveCards.filter(c => c[0] === species).length < 2) {
			saveCards.push(card);
		}
		// Enhanced logic: Consider play area development
		else if (analysis && analysis.currentPlayAreaScore > 0) {
			// If we already have cards of this species in play area, prefer to play
			playCards.push(card);
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

// Rainbow staircase functions (inspired by decent bot)
export function canBuildRainbowStaircase(playArea: playArea): boolean {
	// Check if we have a foundation to build on
	return playArea[0]?.[0] !== undefined;
}

export function findStaircaseEnds(playArea: playArea): {
	lowestEnd: [Card, coord] | null;
	highestEnd: [Card, coord] | null;
} {
	if (!canBuildRainbowStaircase(playArea)) {
		return { lowestEnd: null, highestEnd: null };
	}

	let lowestCard: Card | null = null;
	let lowestCoord: coord | null = null;
	let highestCard: Card | null = null;
	let highestCoord: coord | null = null;

	// Find the lowest and highest cards in the staircase
	for (const x of Object.keys(playArea)) {
		const row = playArea[Number(x)]!;
		for (const y of Object.keys(row)) {
			const card = row[Number(y)]!;
			if (!lowestCard || card[1] < lowestCard[1]) {
				lowestCard = card;
				lowestCoord = [Number(x), Number(y)];
			}
			if (!highestCard || card[1] > highestCard[1]) {
				highestCard = card;
				highestCoord = [Number(x), Number(y)];
			}
		}
	}

	return {
		lowestEnd: lowestCard && lowestCoord ? [lowestCard, lowestCoord] : null,
		highestEnd: highestCard && highestCoord ? [highestCard, highestCoord] : null
	};
}

export function getStaircaseTargets(playArea: playArea): {
	lowTarget: number;
	highTarget: number;
	lowCoord: coord | null;
	highCoord: coord | null;
} {
	const { lowestEnd, highestEnd } = findStaircaseEnds(playArea);
	
	if (!lowestEnd || !highestEnd) {
		return { lowTarget: 1, highTarget: 8, lowCoord: null, highCoord: null };
	}

	const [lowestCard, lowCoord] = lowestEnd;
	const [highestCard, highCoord] = highestEnd;
	
	// Find adjacent empty coordinates for the lowest and highest cards
	const lowAdjacent = findAdjacentEmptyCoord(playArea, lowCoord);
	const highAdjacent = findAdjacentEmptyCoord(playArea, highCoord);
	
	return {
		lowTarget: lowestCard[1] - 1,
		highTarget: highestCard[1] + 1,
		lowCoord: lowAdjacent,
		highCoord: highAdjacent
	};
}

function findAdjacentEmptyCoord(playArea: playArea, cardCoord: coord): coord | null {
	const [x, y] = cardCoord;
	const adjacentCoords: coord[] = [
		[x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y]
	];
	
	for (const [adjX, adjY] of adjacentCoords) {
		if (playArea[adjX]?.[adjY] === undefined) {
			return [adjX, adjY];
		}
	}
	
	return null;
}

export function findStaircaseCard(hand: Hand, targetRank: number): Card | null {
	// Find cards closest to the target rank
	const candidates = hand
		.filter(card => card[1] <= targetRank)
		.sort((a, b) => targetRank - a[1] - (targetRank - b[1]));
	
	return candidates.length > 0 ? candidates[0]! : null;
}

export function findStaircaseCardHigh(hand: Hand, targetRank: number): Card | null {
	// Find cards closest to the target rank (for high end)
	const candidates = hand
		.filter(card => card[1] >= targetRank)
		.sort((a, b) => a[1] - targetRank - (b[1] - targetRank));
	
	return candidates.length > 0 ? candidates[0]! : null;
} 