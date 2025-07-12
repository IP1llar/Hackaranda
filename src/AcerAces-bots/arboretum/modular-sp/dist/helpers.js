// Species types
export const SPECIES = ['J', 'R', 'C', 'M', 'O', 'W'];
// Card string representation for comparison
export function cardString(card) {
    return `${card[0]}${card[1]}`;
}
// Get all empty spaces adjacent to played cards
export function getAllEmptySpaces(playArea) {
    const toView = [[0, 0]];
    const visitedCards = new Set();
    const emptySpaces = [];
    while (toView.length) {
        const [x, y] = toView.pop();
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
        const coordOptions = [
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
export function placeCardInPlayArea(playArea, newCard, newX, newY) {
    const newPlayArea = {};
    for (let x of Object.keys(playArea)) {
        const row = playArea[Number(x)];
        for (let y of Object.keys(row)) {
            const card = row[Number(y)];
            playAreaInsert(newPlayArea, card, Number(x), Number(y));
        }
    }
    playAreaInsert(newPlayArea, newCard, newX, newY);
    return newPlayArea;
}
function playAreaInsert(playArea, card, x, y) {
    const row = playArea[x];
    if (row == undefined) {
        playArea[x] = {};
    }
    playArea[x][y] = card;
}
// Analyze hand for potential high-scoring species
export function analyzeHand(hand, playArea) {
    const speciesCount = {
        J: 0, R: 0, C: 0, M: 0, O: 0, W: 0
    };
    const speciesRanks = {
        J: [], R: [], C: [], M: [], O: [], W: []
    };
    for (const card of hand) {
        const [species, rank] = card;
        speciesCount[species]++;
        speciesRanks[species].push(rank);
    }
    // Calculate potential scores for each species
    const speciesScores = {};
    for (const species of SPECIES) {
        const ranks = speciesRanks[species];
        const totalRank = ranks.reduce((sum, rank) => sum + rank, 0);
        const has1 = ranks.includes(1);
        const has8 = ranks.includes(8);
        // Current play area score for this species
        const currentPlayAreaScore = playArea ? scorePlayArea(playArea, species)[0] : 0;
        // Basic scoring potential
        let score = totalRank;
        if (has1)
            score += 1;
        if (has8)
            score += 2;
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
                if (sortedRanks[i + 1] - sortedRanks[i] === 1) {
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
export function checkOpponentOnes(opponentHand) {
    const opponentOnes = new Set();
    for (const card of opponentHand) {
        if (card && card[1] === 1) {
            opponentOnes.add(card[0]);
        }
    }
    return opponentOnes;
}
// Categorize cards into save vs play groups
export function categorizeCards(hand, opponentHand, playArea) {
    const handAnalysis = analyzeHand(hand, playArea);
    const opponentOnes = checkOpponentOnes(opponentHand);
    const saveCards = [];
    const playCards = [];
    // Sort species by enhanced potential score (considering play area)
    const sortedSpecies = Object.entries(handAnalysis)
        .sort((a, b) => b[1].potentialScore - a[1].potentialScore);
    // Keep top 2 species for saving (strategy #3)
    const saveSpecies = sortedSpecies.slice(0, 2).map(([species]) => species);
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
export function calculatePositionScore(playArea, hand, opponentHand) {
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
export function shouldAccelerateGame(state) {
    const ourScore = calculatePositionScore(state.playArea, state.hand, state.opponentHand);
    const opponentScore = calculatePositionScore(state.opponentPlayArea, state.opponentHand.filter(card => card !== null), state.hand);
    // Strategy #6: Accelerate if we're ahead
    return ourScore > opponentScore;
}
// Basic scoring function (simplified version)
export function scorePlayArea(playArea, species) {
    // This is a simplified scoring - in practice you'd want the full path-finding algorithm
    let score = 0;
    // Count cards of this species in play area
    for (const x of Object.keys(playArea)) {
        const row = playArea[Number(x)];
        for (const y of Object.keys(row)) {
            const card = row[Number(y)];
            if (card[0] === species) {
                score += card[1]; // Basic score based on rank
            }
        }
    }
    return [score, []];
}
// Get most common species in hand
export function getMostCommonSpecies(hand) {
    const speciesCount = {
        J: 0, R: 0, C: 0, M: 0, O: 0, W: 0
    };
    for (const card of hand) {
        const species = card[0];
        speciesCount[species]++;
    }
    let mostCommon = 'J';
    let maxCount = 0;
    for (const [species, count] of Object.entries(speciesCount)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = species;
        }
    }
    return mostCommon;
}
//# sourceMappingURL=helpers.js.map