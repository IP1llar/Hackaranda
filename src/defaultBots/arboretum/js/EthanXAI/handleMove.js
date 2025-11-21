const { drawMove } = require('./draw.js');
const { playMove } = require('./play.js');
const { discardMove } = require('./discard.js');
const { logSpeciesStrategy, logScoringRights } = require('./logging.js');
const { inferOpponentStrategy, inferOurStrategy, calculateScoringRights, trackScoringRightsChanges } = require('./opponentModel.js');
const { approximateScore } = require('./scoring.js');

// Store previous state for tracking changes
let previousScoringRights = {};

/**
 * Main move handler - routes to appropriate move function based on subTurn
 * @param {Object} state - Current game state
 * @returns {number|Object} The chosen move
 */
function handleMove(state) {
  // Log species strategy at the start of each turn (after both draws)
  if (state.subTurn === 2) {
    const opponentStrategy = inferOpponentStrategy(state);
    const ourStrategy = inferOurStrategy(state);
    logSpeciesStrategy(state, ourStrategy, opponentStrategy);
    
    // Calculate and log scoring rights
    const currentRights = calculateScoringRights(state);
    const changes = trackScoringRightsChanges(previousScoringRights, currentRights);
    
    // Calculate evaluation scores (for MCTS guidance, not actual game scores)
    const ourEvaluation = approximateScore(state.playArea, state.hand, state.opponentHand || []);
    const theirEvaluation = approximateScore(state.opponentPlayArea, state.opponentHand || [], state.hand);
    
    logScoringRights(state, changes.gained, changes.lost, changes.maintained, ourEvaluation, theirEvaluation);
    
    previousScoringRights = currentRights;
  }
  
  switch (state.subTurn) {
    case 0: // First draw
    case 1: // Second draw
      return drawMove(state);
    case 2: // Play a card
      return playMove(state);
    case 3: // Discard a card
      return discardMove(state);
    default:
      return 0; // Fallback
  }
}

module.exports = { handleMove };

