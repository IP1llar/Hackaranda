const { heuristicDrawMove } = require('./heuristics.js');
const { mctsDrawMove } = require('./mcts.js');
const { logDecision, logTiming } = require('./logging.js');

/**
 * Choose which pile to draw from
 * @param {Object} state - Current game state
 * @returns {number} 0 for deck, 1 for your discard, 2 for opponent's discard
 */
function drawMove(state) {
  const startTime = Date.now();
  
  // Get heuristic choice
  const heuristicChoice = heuristicDrawMove(state);
  
  // Try MCTS
  const result = mctsDrawMove(state, heuristicDrawMove);
  const mctsChoice = result.move;
  const usedMCTS = result.usedMCTS || false;
  
  // Log the decision
  logDecision('draw', state, heuristicChoice, mctsChoice, result.stats, usedMCTS);
  
  const duration = Date.now() - startTime;
  logTiming('drawMove', duration);
  
  return mctsChoice;
}

module.exports = { drawMove };

/**
 * Randomly choose from available draw options
 * @param {Object} state - Current game state
 * @returns {number} 0, 1, or 2
 */
function randomDrawMove(state) {
  const options = [];
  
  // 0 = draw from deck
  if (state.deck > 0) {
    options.push(0);
  }
  
  // 1 = draw from your discard pile
  if (state.discard.length > 0) {
    options.push(1);
  }
  
  // 2 = draw from opponent's discard pile
  if (state.opponentDiscard.length > 0) {
    options.push(2);
  }
  
  // Pick a random valid option
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

/**
 * Get the most common species in hand
 * @param {Array} hand - Your current hand
 * @returns {string} Most common species
 */
function getMostCommonSpecies(hand) {
  const speciesCount = {};
  
  for (const card of hand) {
    const [species] = card;
    speciesCount[species] = (speciesCount[species] || 0) + 1;
  }
  
  let maxCount = 0;
  let mostCommon = 'J';
  
  for (const [species, count] of Object.entries(speciesCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = species;
    }
  }
  
  return mostCommon;
}

/**
 * Check if a discard pile card is useful
 * @param {Array} card - The card to evaluate [species, rank]
 * @param {Array} hand - Your current hand
 * @returns {boolean} True if card matches species in hand
 */
function isCardUseful(card, hand) {
  const [targetSpecies, targetRank] = card;
  
  // Check if we have cards of the same species
  for (const handCard of hand) {
    const [species] = handCard;
    if (species === targetSpecies) {
      return true;
    }
  }
  
  return false;
}

module.exports = { drawMove };
