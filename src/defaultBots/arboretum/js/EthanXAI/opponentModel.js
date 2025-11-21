/**
 * Opponent Modeling Module
 * Tracks opponent's strategy and infers their collection priorities
 */

const SPECIES = ['J', 'R', 'C', 'M', 'O', 'W'];

/**
 * Infer which species the opponent is collecting vs abandoning
 * @param {Object} state - Current game state
 * @returns {Object} {collecting: Array, abandoning: Array}
 */
function inferOpponentStrategy(state) {
  const speciesStats = {};
  
  // Initialize counters
  for (const species of SPECIES) {
    speciesStats[species] = {
      playAreaCount: 0,
      discardCount: 0,
      maxRank: 0,
      minRank: 8
    };
  }
  
  // Count cards in opponent's play area
  for (const x in state.opponentPlayArea) {
    for (const y in state.opponentPlayArea[x]) {
      const [species, rank] = state.opponentPlayArea[x][y];
      speciesStats[species].playAreaCount++;
      speciesStats[species].maxRank = Math.max(speciesStats[species].maxRank, rank);
      speciesStats[species].minRank = Math.min(speciesStats[species].minRank, rank);
    }
  }
  
  // Count cards in opponent's discard pile
  for (const card of state.opponentDiscard) {
    const [species, rank] = card;
    speciesStats[species].discardCount++;
  }
  
  // Classify species
  const collecting = [];
  const abandoning = [];
  
  for (const species of SPECIES) {
    const stats = speciesStats[species];
    
    // Strong signal: 2+ in play area = collecting
    if (stats.playAreaCount >= 2) {
      collecting.push(species);
    }
    // Strong signal: 2+ discarded = abandoning
    else if (stats.discardCount >= 2) {
      abandoning.push(species);
    }
    // Weak signal: 1 in play area but also discarded = uncertain
    else if (stats.playAreaCount === 1 && stats.discardCount === 0) {
      collecting.push(species);
    }
    // No data yet
    else if (stats.playAreaCount === 0 && stats.discardCount === 0) {
      // Neutral - don't add to either list
    }
  }
  
  return { collecting, abandoning };
}

/**
 * Infer our own strategy based on what we're playing/discarding
 * @param {Object} state - Current game state
 * @returns {Object} {collecting: Array, abandoning: Array}
 */
function inferOurStrategy(state) {
  const speciesStats = {};
  
  // Initialize counters
  for (const species of SPECIES) {
    speciesStats[species] = {
      playAreaCount: 0,
      handCount: 0,
      handSum: 0,
      discardCount: 0
    };
  }
  
  // Count cards in our play area
  for (const x in state.playArea) {
    for (const y in state.playArea[x]) {
      const [species, rank] = state.playArea[x][y];
      speciesStats[species].playAreaCount++;
    }
  }
  
  // Count cards in our hand
  for (const card of state.hand) {
    const [species, rank] = card;
    speciesStats[species].handCount++;
    speciesStats[species].handSum += rank;
  }
  
  // Count cards in our discard pile
  for (const card of state.discard) {
    const [species, rank] = card;
    speciesStats[species].discardCount++;
  }
  
  // Classify species
  const collecting = [];
  const abandoning = [];
  
  for (const species of SPECIES) {
    const stats = speciesStats[species];
    
    // Collecting if: high hand count OR played multiple
    if (stats.handCount >= 2 || stats.playAreaCount >= 2) {
      collecting.push(species);
    }
    // Abandoning if: discarded multiple and none in hand
    else if (stats.discardCount >= 2 && stats.handCount === 0) {
      abandoning.push(species);
    }
  }
  
  return { collecting, abandoning };
}

/**
 * Calculate scoring rights for all species
 * @param {Object} state - Current game state
 * @returns {Object} species -> 'us', 'them', or 'unknown'
 */
function calculateScoringRights(state) {
  const rights = {};
  
  for (const species of SPECIES) {
    const ourSum = state.hand
      .filter(c => c[0] === species)
      .reduce((sum, c) => sum + c[1], 0);
    
    // We can't know opponent's exact hand, but we can estimate
    // For now, mark as 'unknown' if we have some cards
    if (ourSum > 0) {
      rights[species] = 'us'; // Optimistic assumption
    } else {
      rights[species] = 'unknown';
    }
  }
  
  return rights;
}

/**
 * Track which species we've gained/lost/maintained scoring rights for
 * Requires storing previous state to compare
 * @param {Object} previousRights - Previous scoring rights
 * @param {Object} currentRights - Current scoring rights
 * @returns {Object} {gained, lost, maintained}
 */
function trackScoringRightsChanges(previousRights, currentRights) {
  const gained = [];
  const lost = [];
  const maintained = [];
  
  for (const species of SPECIES) {
    const prev = previousRights[species];
    const curr = currentRights[species];
    
    if (prev !== 'us' && curr === 'us') {
      gained.push(species);
    } else if (prev === 'us' && curr !== 'us') {
      lost.push(species);
    } else if (prev === 'us' && curr === 'us') {
      maintained.push(species);
    }
  }
  
  return { gained, lost, maintained };
}

module.exports = {
  inferOpponentStrategy,
  inferOurStrategy,
  calculateScoringRights,
  trackScoringRightsChanges,
  SPECIES
};
