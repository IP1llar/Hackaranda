const { getAllEmptyAdjacentSpaces, pickRandomFromArray } = require('./helpers.js');

/**
 * Fast heuristic strategies for fallback when MCTS doesn't have confidence
 */

/**
 * Heuristic draw move: prefer cards matching most common species
 * @param {Object} state - Current game state
 * @returns {number} 0 (deck), 1 (your discard), or 2 (opponent discard)
 */
function heuristicDrawMove(state) {
  const mostCommonSpecies = getMostCommonSpecies(state.hand);
  
  // Check your discard pile
  if (state.discard.length > 0) {
    const topCard = state.discard[state.discard.length - 1];
    if (topCard[0] === mostCommonSpecies) {
      return 1; // Draw from your discard
    }
  }
  
  // Check opponent's discard pile
  if (state.opponentDiscard.length > 0) {
    const topCard = state.opponentDiscard[state.opponentDiscard.length - 1];
    if (topCard[0] === mostCommonSpecies) {
      return 2; // Draw from opponent's discard
    }
  }
  
  // Otherwise draw from deck (or random if deck empty)
  return randomValidDraw(state);
}

/**
 * Heuristic play move: prioritize path building
 * @param {Object} state - Current game state
 * @returns {Object} {card: [species, rank], coord: [x, y]}
 */
function heuristicPlayMove(state) {
  // First move must be at origin
  if (Object.keys(state.playArea).length === 0) {
    // Pick LOW-rank card (1-3) to keep high cards in hand for scoring rights
    const sortedByRank = [...state.hand].sort((a, b) => a[1] - b[1]);
    return { card: sortedByRank[0], coord: [0, 0] };
  }
  
  // STRATEGY v4: Prioritize building 4+ card paths (doubles the score!)
  const speciesCounts = countSpeciesByType(state.hand);
  const emptySpaces = getAllEmptyAdjacentSpaces(state.playArea);
  
  let bestScore = -Infinity;
  let bestCard = state.hand[0];
  let bestCoord = [0, 0];
  
  for (const card of state.hand) {
    const [species, rank] = card;
    
    // Moderate penalty for playing high-rank cards (keep them for scoring rights)
    // But this is now LESS important than path building
    let rankPenalty = 0;
    if (rank >= 7) {
      rankPenalty = -15; // Reduced from -30
    } else if (rank >= 5) {
      rankPenalty = -5; // Reduced from -10
    }
    
    // Bonus if we have few of this species (safe to play without losing scoring rights)
    const speciesBonus = speciesCounts[species] > 2 ? 0 : 10;
    
    for (const coord of emptySpaces) {
      const positionScore = estimatePlayScore(state.playArea, card, coord, state.hand);
      const totalScore = positionScore + rankPenalty + speciesBonus;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestCard = card;
        bestCoord = coord;
      }
    }
  }
  
  return { card: bestCard, coord: bestCoord };
}

/**
 * Heuristic discard move: discard card with lowest keep-value
 * Keep value prioritizes high ranks of species we're collecting
 * @param {Object} state - Current game state
 * @returns {Array} [species, rank]
 */
function heuristicDiscardMove(state) {
  const speciesCounts = countSpeciesByType(state.hand);
  
  // Find species we're NOT collecting (count <= 1)
  const abandonedSpecies = [];
  const collectedSpecies = [];
  
  for (const [species, count] of Object.entries(speciesCounts)) {
    if (count <= 1) {
      abandonedSpecies.push(species);
    } else {
      collectedSpecies.push(species);
    }
  }
  
  // PRIORITY 1: Discard LOW-rank cards of abandoned species
  for (const card of state.hand) {
    const [species, rank] = card;
    if (abandonedSpecies.includes(species)) {
      // Found abandoned species - prefer lowest rank
      const abandonedCards = state.hand.filter(c => abandonedSpecies.includes(c[0]));
      abandonedCards.sort((a, b) => a[1] - b[1]); // Sort by rank ascending
      return abandonedCards[0];
    }
  }
  
  // PRIORITY 2: If all species are being collected, discard LOWEST rank overall
  // NEVER discard high ranks (6-8) if we can avoid it
  let lowestCard = state.hand[0];
  for (const card of state.hand) {
    if (card[1] < lowestCard[1]) {
      lowestCard = card;
    }
  }
  
  return lowestCard;
}

/**
 * Get the most common species in hand
 * @param {Array} hand - Your hand
 * @returns {string} Most common species
 */
function getMostCommonSpecies(hand) {
  const counts = { J: 0, R: 0, C: 0, M: 0, O: 0, W: 0 };
  
  for (const card of hand) {
    counts[card[0]]++;
  }
  
  let maxCount = 0;
  let mostCommon = 'J';
  
  for (const [species, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = species;
    }
  }
  
  return mostCommon;
}

/**
 * Count cards by species
 * @param {Array} hand - Your hand
 * @returns {Object} {species: count}
 */
function countSpeciesByType(hand) {
  const counts = { J: 0, R: 0, C: 0, M: 0, O: 0, W: 0 };
  
  for (const card of hand) {
    counts[card[0]]++;
  }
  
  return counts;
}

/**
 * Random valid draw (fallback)
 * @param {Object} state - Current game state
 * @returns {number} 0, 1, or 2
 */
function randomValidDraw(state) {
  const options = [];
  if (state.deck > 0) options.push(0);
  if (state.discard.length > 0) options.push(1);
  if (state.opponentDiscard.length > 0) options.push(2);
  return pickRandomFromArray(options);
}

/**
 * Estimate score for placing a card (fast approximation)
 * Prioritizes building 4+ card paths since they double in score
 * @param {Object} playArea - Current play area
 * @param {Array} card - Card to place [species, rank]
 * @param {Array} coord - Coordinate [x, y]
 * @param {Array} hand - Current hand
 * @returns {number} Estimated score
 */
function estimatePlayScore(playArea, card, coord, hand) {
  const [species, rank] = card;
  
  // Count existing cards of this species on board
  let speciesOnBoard = 0;
  for (const x in playArea) {
    for (const y in playArea[x]) {
      if (playArea[x][y][0] === species) {
        speciesOnBoard++;
      }
    }
  }
  
  // MASSIVE bonus for reaching 4-card threshold (score doubles!)
  let pathThresholdBonus = 0;
  if (speciesOnBoard === 3) {
    // Playing 4th card of species = doubles the score!
    pathThresholdBonus = 100;
  } else if (speciesOnBoard === 2) {
    // Playing 3rd card = one away from threshold
    pathThresholdBonus = 30;
  } else if (speciesOnBoard === 1) {
    // Playing 2nd card = starting a path
    pathThresholdBonus = 15;
  }
  
  // Base score from connectivity
  let score = pathThresholdBonus;
  
  // Check adjacent cards
  const [x, y] = coord;
  const adjacentCoords = [
    [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
  ];
  
  let sameSpeciesAdjacent = 0;
  let sequentialBonus = 0;
  
  for (const [adjX, adjY] of adjacentCoords) {
    const adjacentCard = playArea[adjX]?.[adjY];
    if (adjacentCard) {
      const [adjSpecies, adjRank] = adjacentCard;
      
      // Bonus for same species adjacent (builds paths)
      if (adjSpecies === species) {
        sameSpeciesAdjacent++;
        score += 20; // Good connectivity
        
        // Extra bonus if ranks are sequential (valid path extension)
        if (Math.abs(adjRank - rank) === 1) {
          sequentialBonus += 30;
        }
      }
    }
  }
  
  score += sequentialBonus;
  
  // Bonus if we have more of this species in hand (better scoring rights)
  const speciesInHand = hand.filter(c => c[0] === species).length;
  score += speciesInHand * 3;
  
  // Extra bonus if placing rank 1 or 8 (start/end bonuses)
  if (rank === 1) score += 5; // +1 point for starting with 1
  if (rank === 8) score += 10; // +2 points for ending with 8
  
  return score;
}

module.exports = {
  heuristicDrawMove,
  heuristicPlayMove,
  heuristicDiscardMove,
  getMostCommonSpecies,
  countSpeciesByType,
  estimatePlayScore
};
