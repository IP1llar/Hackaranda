const { heuristicPlayMove } = require('./heuristics.js');
const { mctsPlayMove } = require('./mcts.js');
const { logDecision, logTiming } = require('./logging.js');

/**
 * Choose which card to play and where to place it
 * @param {Object} state - Current game state
 * @returns {Object} {card: [species, rank], coord: [x, y]}
 */
function playMove(state) {
  const startTime = Date.now();
  
  // Get heuristic choice
  const heuristicChoice = heuristicPlayMove(state);
  
  // Try MCTS
  const result = mctsPlayMove(state, heuristicPlayMove);
  const mctsChoice = result.move;
  const usedMCTS = result.usedMCTS || false;
  
  // Log the decision
  logDecision('play', state, heuristicChoice, mctsChoice, result.stats, usedMCTS);
  
  const duration = Date.now() - startTime;
  logTiming('playMove', duration);
  
  return mctsChoice;
}

module.exports = { playMove };

/**
 * Play a random card from hand in a random valid position
 * @param {Object} state - Current game state
 * @returns {Object} {card: [species, rank], coord: [x, y]}
 */
function randomPlayMove(state) {
  // Pick a random card from hand
  const card = pickRandomFromArray(state.hand);
  
  // If playArea is empty, must play at [0, 0]
  if (Object.keys(state.playArea).length === 0) {
    return { card, coord: [0, 0] };
  }
  
  // Find a valid adjacent coordinate
  const coord = findValidCoordinate(state.playArea);
  
  return { card, coord };
}

/**
 * Evaluate the best card to play based on strategy
 * @param {Array} hand - Your current hand
 * @param {Object} playArea - Your current play area
 * @returns {Array} [species, rank] of best card to play
 */
function chooseBestCardToPlay(hand, playArea) {
  // TODO: Implement strategic card selection
  // Ideas:
  // - Extend existing paths of same species
  // - Keep high-value cards in hand for scoring rights
  // - Play cards that block opponent's potential paths
  
  return hand[0]; // Default: return first card
}

/**
 * Find the best coordinate to place a card
 * @param {Array} card - The card to place [species, rank]
 * @param {Object} playArea - Your current play area
 * @returns {Array} [x, y] coordinate
 */
function findBestCoordinate(card, playArea) {
  // TODO: Implement strategic placement
  // Ideas:
  // - Extend paths with ascending ranks
  // - Place cards to maximize future placement options
  // - Build paths that are easy to score
  
  const [species, rank] = card;
  
  // For now, use the helper function to find any valid coordinate
  return findValidCoordinate(playArea);
}

module.exports = { playMove };
