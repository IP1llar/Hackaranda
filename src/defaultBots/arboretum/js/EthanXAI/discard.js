const { heuristicDiscardMove } = require('./heuristics.js');
const { mctsDiscardMove } = require('./mcts.js');
const { logDecision, logTiming } = require('./logging.js');

/**
 * Choose which card to discard
 * @param {Object} state - Current game state
 * @returns {Array} [species, rank]
 */
function discardMove(state) {
  const startTime = Date.now();
  
  // Get heuristic choice
  const heuristicChoice = heuristicDiscardMove(state);
  
  // Try MCTS
  const result = mctsDiscardMove(state, heuristicDiscardMove);
  const mctsChoice = result.move;
  const usedMCTS = result.usedMCTS || false;
  
  // Log the decision
  logDecision('discard', state, heuristicChoice, mctsChoice, result.stats, usedMCTS);
  
  const duration = Date.now() - startTime;
  logTiming('discardMove', duration);
  
  return mctsChoice;
}

module.exports = { discardMove };

/**
 * Discard a random card from hand
 * @param {Object} state - Current game state
 * @returns {Array} [species, rank]
 */
function randomDiscardMove(state) {
  return pickRandomFromArray(state.hand);
}

/**
 * Find the least valuable card in hand
 * @param {Array} hand - Your current hand
 * @param {Object} playArea - Your current play area
 * @returns {Array} [species, rank] of card to discard
 */
function findLeastValuableCard(hand, playArea) {
  // TODO: Implement strategic discard selection
  // Ideas:
  // - Discard species you're not collecting
  // - Keep high-value cards for scoring rights
  // - Consider what's already in play areas
  
  // Simple strategy: discard lowest rank card
  let lowestCard = hand[0];
  let lowestRank = hand[0][1];
  
  for (const card of hand) {
    const [species, rank] = card;
    if (rank < lowestRank) {
      lowestRank = rank;
      lowestCard = card;
    }
  }
  
  return lowestCard;
}

/**
 * Count how many cards of each species are in hand
 * @param {Array} hand - Your current hand
 * @returns {Object} Object mapping species to count
 */
function countSpeciesInHand(hand) {
  const counts = { J: 0, R: 0, C: 0, M: 0, O: 0, W: 0 };
  
  for (const card of hand) {
    const [species] = card;
    counts[species]++;
  }
  
  return counts;
}

/**
 * Determine if discarding this card would help opponent
 * @param {Array} card - Card to evaluate [species, rank]
 * @param {Object} opponentPlayArea - Opponent's play area
 * @returns {boolean} True if card is likely useful to opponent
 */
function isCardUsefulToOpponent(card, opponentPlayArea) {
  // TODO: Implement opponent analysis
  // Check if the card matches species they're collecting
  
  const [species, rank] = card;
  
  // Check if opponent has cards of this species in their play area
  for (const x in opponentPlayArea) {
    for (const y in opponentPlayArea[x]) {
      const opponentCard = opponentPlayArea[x][y];
      if (opponentCard[0] === species) {
        return true; // They're collecting this species
      }
    }
  }
  
  return false;
}

module.exports = { discardMove };
