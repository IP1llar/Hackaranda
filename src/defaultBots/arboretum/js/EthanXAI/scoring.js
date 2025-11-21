/**
 * Efficient scoring module for Arboretum
 * Finds longest valid paths and calculates final scores
 */

const SPECIES = ['J', 'R', 'C', 'M', 'O', 'W'];

/**
 * Calculate final score for a player
 * @param {Object} playArea - Player's play area
 * @param {Array} hand - Player's hand
 * @param {Array} opponentHand - Opponent's hand (or approximation)
 * @returns {number} Total score
 */
function calculateScore(playArea, hand, opponentHand) {
  const ourSpeciesSums = calculateSpeciesSums(hand);
  const theirSpeciesSums = calculateSpeciesSums(opponentHand);
  
  let totalScore = 0;
  
  for (const species of SPECIES) {
    // Only score if we have scoring rights (higher sum in hand)
    if (ourSpeciesSums[species] > theirSpeciesSums[species]) {
      const pathScore = findLongestPath(playArea, species);
      totalScore += pathScore;
    }
  }
  
  return totalScore;
}

/**
 * Calculate sum of ranks per species in hand
 * @param {Array} hand - Array of cards
 * @returns {Object} {species: sum}
 */
function calculateSpeciesSums(hand) {
  const sums = { J: 0, R: 0, C: 0, M: 0, O: 0, W: 0 };
  
  for (const card of hand) {
    if (card) { // Handle null cards in opponent hand
      sums[card[0]] += card[1];
    }
  }
  
  return sums;
}

/**
 * Find longest valid path for a species in play area
 * Valid path: same species, ascending ranks, connected
 * @param {Object} playArea - Play area
 * @param {string} species - Species to score
 * @returns {number} Score (sum of ranks in longest path)
 */
function findLongestPath(playArea, species) {
  // Get all cards of this species with their coordinates
  const speciesCards = [];
  
  for (const x in playArea) {
    for (const y in playArea[x]) {
      const card = playArea[x][y];
      if (card[0] === species) {
        speciesCards.push({
          card,
          x: parseInt(x),
          y: parseInt(y),
          rank: card[1]
        });
      }
    }
  }
  
  if (speciesCards.length === 0) return 0;
  if (speciesCards.length === 1) return speciesCards[0].rank;
  
  // Try starting from each card and find longest ascending path
  let maxScore = 0;
  
  for (const startCard of speciesCards) {
    const pathScore = findPathFrom(startCard, speciesCards, playArea);
    maxScore = Math.max(maxScore, pathScore);
  }
  
  return maxScore;
}

/**
 * Find longest ascending path starting from a specific card
 * Uses DFS to explore all valid paths
 * @param {Object} start - Starting card with {card, x, y, rank}
 * @param {Array} allCards - All cards of this species
 * @param {Object} playArea - Play area for adjacency checks
 * @returns {number} Best path score from this start
 */
function findPathFrom(start, allCards, playArea) {
  const visited = new Set();
  
  function dfs(current, currentScore) {
    const key = `${current.x},${current.y}`;
    visited.add(key);
    
    let bestScore = currentScore;
    
    // Find adjacent cards of same species with higher rank
    for (const next of allCards) {
      const nextKey = `${next.x},${next.y}`;
      
      if (visited.has(nextKey)) continue;
      if (next.rank <= current.rank) continue; // Must be ascending
      
      // Check if adjacent
      const dx = Math.abs(next.x - current.x);
      const dy = Math.abs(next.y - current.y);
      const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      
      if (!isAdjacent) continue;
      
      // Explore this path
      const pathScore = dfs(next, currentScore + next.rank);
      bestScore = Math.max(bestScore, pathScore);
    }
    
    visited.delete(key);
    return bestScore;
  }
  
  return dfs(start, start.rank);
}

/**
 * Fast approximate scoring for MCTS rollouts
 * 
 * IMPORTANT: This is an EVALUATION FUNCTION, not a score predictor!
 * 
 * Real Arboretum scoring:
 *   - Base score = path length (not rank sum!)
 *   - 4+ card bonus = doubles the score
 *   - Rank 1 start = +1, Rank 8 end = +2
 *   - Single cards = 0 points
 * 
 * This approximation:
 *   - Counts connected cards per species (path length)
 *   - Applies 4+ card bonus (doubles score)
 *   - Adds strategic bonuses for scoring rights and hand value
 * 
 * The bonuses teach MCTS to:
 *   1. Protect scoring rights (+10 per species)
 *   2. Value hand composition (+0.5 × hand value)
 *   3. Prioritize building 4+ card paths (2x multiplier)
 * 
 * Trades accuracy for speed and strategic guidance.
 * Returns ~1.5-2x higher than actual game scores due to bonuses.
 * 
 * @param {Object} playArea - Play area
 * @param {Array} hand - Player's hand
 * @param {Array} opponentHand - Opponent's hand
 * @returns {number} Evaluation score (NOT predicted final score)
 */
function approximateScore(playArea, hand, opponentHand) {
  const ourSums = calculateSpeciesSums(hand);
  const theirSums = calculateSpeciesSums(opponentHand);
  
  let totalScore = 0;
  let scoringRightsCount = 0;
  
  for (const species of SPECIES) {
    // Check if we have scoring rights (STRICTLY greater, not equal)
    if (ourSums[species] > theirSums[species]) {
      scoringRightsCount++;
      
      // Count connected cards of this species (approximate path length)
      const speciesCards = [];
      for (const x in playArea) {
        for (const y in playArea[x]) {
          const card = playArea[x][y];
          if (card[0] === species) {
            speciesCards.push({
              card,
              x: parseInt(x),
              y: parseInt(y),
              rank: card[1]
            });
          }
        }
      }
      
      if (speciesCards.length === 0) continue;
      
      // Approximate: assume longest path contains most cards
      // In practice, connectivity is usually good
      const pathLength = speciesCards.length;
      
      // Base score = path length
      let pathScore = pathLength;
      
      // 4+ card bonus: doubles the score!
      if (pathLength >= 4) {
        pathScore += pathLength; // Add length again = 2x
      }
      
      // Start/end bonuses (approximate - we don't check connectivity here)
      const ranks = speciesCards.map(c => c.rank);
      if (ranks.includes(1)) pathScore += 1; // Might start with 1
      if (ranks.includes(8)) pathScore += 2; // Might end with 8
      
      totalScore += pathScore;
    }
  }
  
  // CRITICAL: Heavily reward having more scoring rights
  // Each species we can score is worth at least 10 points in evaluation
  // (This is on top of the actual path score, to emphasize importance)
  totalScore += scoringRightsCount * 10;
  
  // BONUS: Reward keeping high-value cards in hand (for scoring rights)
  const handValue = hand.reduce((sum, card) => sum + (card ? card[1] : 0), 0);
  totalScore += handValue * 0.5; // Hand value is important!
  
  return totalScore;
}

/**
 * Check if a coordinate is adjacent to any card in play area
 * @param {Object} playArea - Play area
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if adjacent to existing card
 */
function isAdjacentToExisting(playArea, x, y) {
  if (x === 0 && y === 0 && Object.keys(playArea).length === 0) {
    return true; // First card
  }
  
  const adjacents = [
    [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
  ];
  
  for (const [adjX, adjY] of adjacents) {
    if (playArea[adjX]?.[adjY]) {
      return true;
    }
  }
  
  return false;
}

module.exports = {
  calculateScore,
  calculateSpeciesSums,
  findLongestPath,
  approximateScore,
  isAdjacentToExisting
};
