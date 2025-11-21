/**
 * MCTS (Monte Carlo Tree Search) Engine
 * Flat MCTS implementation (no tree structure) for fast move evaluation
 */

const { determinizeOpponentHand, fastRollout, cloneState } = require('./simulation.js');
const { getAllEmptyAdjacentSpaces, pickRandomFromArray } = require('./helpers.js');
const { logMCTSStats } = require('./logging.js');

// Configuration
const CONFIG = {
  MCTS_TIME_BUDGET: 600,        // ms per move for MCTS
  CONFIDENCE_THRESHOLD: 0.15,   // Win rate gap to trust MCTS  
  MIN_TRIALS: 50,               // Minimum simulations before confidence check
  ROLLOUT_MAX_DEPTH: 10,        // Max moves per simulation
  ROLLOUT_TIME_LIMIT: 15,       // ms max per rollout
  EARLY_TERMINATION: 0.80,      // Stop if move has 80%+ win rate
};

/**
 * Run MCTS to find best draw move
 * @param {Object} state - Current game state
 * @param {Function} heuristicMove - Fallback heuristic function
 * @returns {Object} {move: number, usedMCTS: boolean, stats: {...}}
 */
function mctsDrawMove(state, heuristicMove) {
  const startTime = Date.now();
  const legalMoves = getLegalDrawMoves(state);
  
  if (legalMoves.length === 1) {
    return {
      move: legalMoves[0],
      usedMCTS: false,
      stats: { winRate: 0, confidence: 0 }
    };
  }
  
  const { moveStats, totalSimulations } = runMCTS(state, legalMoves, applyDrawMove);
  const result = selectBestMove(moveStats, heuristicMove(state), legalMoves);
  
  // Log MCTS statistics
  const timeUsed = Date.now() - startTime;
  const statsArray = Array.from(moveStats.values()).sort((a, b) => b.winRate - a.winRate);
  if (statsArray.length >= 2) {
    logMCTSStats('draw', CONFIG.MCTS_TIME_BUDGET, timeUsed, totalSimulations, legalMoves.length, statsArray[0], statsArray[1]);
  }
  
  return result;
}

/**
 * Run MCTS to find best play move
 * @param {Object} state - Current game state
 * @param {Function} heuristicMove - Fallback heuristic function
 * @returns {Object} {move: Object, usedMCTS: boolean, stats: {...}}
 */
function mctsPlayMove(state, heuristicMove) {
  const startTime = Date.now();
  const legalMoves = getLegalPlayMoves(state);
  
  if (legalMoves.length === 1) {
    return {
      move: legalMoves[0],
      usedMCTS: false,
      stats: { winRate: 0, confidence: 0 }
    };
  }
  
  const { moveStats, totalSimulations } = runMCTS(state, legalMoves, applyPlayMove);
  const result = selectBestMove(moveStats, heuristicMove(state), legalMoves);
  
  // Log MCTS statistics
  const timeUsed = Date.now() - startTime;
  const statsArray = Array.from(moveStats.values()).sort((a, b) => b.winRate - a.winRate);
  if (statsArray.length >= 2) {
    logMCTSStats('play', CONFIG.MCTS_TIME_BUDGET, timeUsed, totalSimulations, legalMoves.length, statsArray[0], statsArray[1]);
  }
  
  return result;
}

/**
 * Run MCTS to find best discard move
 * @param {Object} state - Current game state
 * @param {Function} heuristicMove - Fallback heuristic function
 * @returns {Object} {move: Array, usedMCTS: boolean, stats: {...}}
 */
function mctsDiscardMove(state, heuristicMove) {
  const startTime = Date.now();
  const legalMoves = state.hand;
  
  if (legalMoves.length === 1) {
    return {
      move: legalMoves[0],
      usedMCTS: false,
      stats: { winRate: 0, confidence: 0 }
    };
  }
  
  const { moveStats, totalSimulations } = runMCTS(state, legalMoves, applyDiscardMove);
  const result = selectBestMove(moveStats, heuristicMove(state), legalMoves);
  
  // Log MCTS statistics
  const timeUsed = Date.now() - startTime;
  const statsArray = Array.from(moveStats.values()).sort((a, b) => b.winRate - a.winRate);
  if (statsArray.length >= 2) {
    logMCTSStats('discard', CONFIG.MCTS_TIME_BUDGET, timeUsed, totalSimulations, legalMoves.length, statsArray[0], statsArray[1]);
  }
  
  return result;
}

/**
 * Core MCTS loop: run simulations for each legal move
 * @param {Object} state - Current state
 * @param {Array} legalMoves - All legal moves
 * @param {Function} applyMoveFn - Function to apply move to state
 * @returns {Object} {moveStats: Map, totalSimulations: number}
 */
function runMCTS(state, legalMoves, applyMoveFn) {
  const startTime = Date.now();
  const moveStats = new Map();
  
  // Initialize stats for each move
  for (const move of legalMoves) {
    moveStats.set(getMoveKey(move), {
      move,
      wins: 0,
      trials: 0,
      winRate: 0
    });
  }
  
  let totalSimulations = 0;
  
  // Run simulations until time budget exhausted
  while (Date.now() - startTime < CONFIG.MCTS_TIME_BUDGET) {
    for (const move of legalMoves) {
      const moveKey = getMoveKey(move);
      const stats = moveStats.get(moveKey);
      
      // Determinize opponent hand
      const deterState = cloneState(state);
      deterState.opponentHand = determinizeOpponentHand(state);
      
      // Apply this move
      const newState = applyMoveFn(deterState, move);
      
      // Rollout to game end
      const { ourScore, theirScore } = fastRollout(
        newState,
        CONFIG.ROLLOUT_MAX_DEPTH,
        CONFIG.ROLLOUT_TIME_LIMIT
      );
      
      // Update statistics
      stats.trials++;
      if (ourScore > theirScore) {
        stats.wins++;
      }
      stats.winRate = stats.wins / stats.trials;
      
      totalSimulations++;
      
      // Early termination if one move clearly dominates
      if (stats.trials >= 100 && stats.winRate >= CONFIG.EARLY_TERMINATION) {
        return { moveStats, totalSimulations };
      }
      
      // Check time budget
      if (Date.now() - startTime >= CONFIG.MCTS_TIME_BUDGET) {
        return { moveStats, totalSimulations };
      }
    }
  }
  
  return { moveStats, totalSimulations };
}

/**
 * Select best move based on MCTS results or heuristic fallback
 * @param {Map} moveStats - Statistics for each move
 * @param {*} heuristicMove - Fallback move from heuristic
 * @param {Array} legalMoves - All legal moves
 * @returns {Object} {move: *, usedMCTS: boolean, stats: {winRate, confidence}}
 */
function selectBestMove(moveStats, heuristicMove, legalMoves) {
  // Find best and second-best moves
  let bestMove = null;
  let bestWinRate = -1;
  let secondBestWinRate = -1;
  let enoughTrials = true;
  
  for (const [key, stats] of moveStats) {
    if (stats.trials < CONFIG.MIN_TRIALS) {
      enoughTrials = false;
    }
    
    if (stats.winRate > bestWinRate) {
      secondBestWinRate = bestWinRate;
      bestWinRate = stats.winRate;
      bestMove = stats.move;
    } else if (stats.winRate > secondBestWinRate) {
      secondBestWinRate = stats.winRate;
    }
  }
  
  // Check if MCTS is confident
  const confidence = bestWinRate - secondBestWinRate;
  
  if (enoughTrials && confidence >= CONFIG.CONFIDENCE_THRESHOLD) {
    return {
      move: bestMove,
      usedMCTS: true,
      stats: { winRate: bestWinRate, confidence }
    };
  }
  
  // Not confident - use heuristic fallback
  return {
    move: heuristicMove,
    usedMCTS: false,
    stats: { winRate: bestWinRate, confidence }
  };
}

/**
 * Get all legal draw moves
 * @param {Object} state - Current state
 * @returns {Array} [0, 1, 2] subset
 */
function getLegalDrawMoves(state) {
  const moves = [];
  if (state.deck > 0) moves.push(0);
  if (state.discard.length > 0) moves.push(1);
  if (state.opponentDiscard.length > 0) moves.push(2);
  return moves;
}

/**
 * Get all legal play moves
 * @param {Object} state - Current state
 * @returns {Array} [{card, coord}, ...]
 */
function getLegalPlayMoves(state) {
  const moves = [];
  const emptySpaces = getAllEmptyAdjacentSpaces(state.playArea);
  
  for (const card of state.hand) {
    for (const coord of emptySpaces) {
      moves.push({ card, coord });
    }
  }
  
  return moves;
}

/**
 * Apply draw move to state
 * @param {Object} state - Current state
 * @param {number} move - Draw move (0, 1, or 2)
 * @returns {Object} New state
 */
function applyDrawMove(state, move) {
  const newState = cloneState(state);
  
  if (move === 0 && state.deck > 0) {
    // Draw from deck (simplified - add a random unseen card)
    newState.deck--;
  } else if (move === 1 && state.discard.length > 0) {
    const card = newState.discard.pop();
    newState.hand.push(card);
  } else if (move === 2 && state.opponentDiscard.length > 0) {
    const card = newState.opponentDiscard.pop();
    newState.hand.push(card);
  }
  
  return newState;
}

/**
 * Apply play move to state
 * @param {Object} state - Current state
 * @param {Object} move - Play move {card, coord}
 * @returns {Object} New state
 */
function applyPlayMove(state, move) {
  const newState = cloneState(state);
  const { card, coord } = move;
  
  // Remove card from hand
  newState.hand = newState.hand.filter(c => 
    c[0] !== card[0] || c[1] !== card[1]
  );
  
  // Place card in play area
  if (!newState.playArea[coord[0]]) {
    newState.playArea[coord[0]] = {};
  }
  newState.playArea[coord[0]][coord[1]] = card;
  
  return newState;
}

/**
 * Apply discard move to state
 * @param {Object} state - Current state
 * @param {Array} card - Card to discard
 * @returns {Object} New state
 */
function applyDiscardMove(state, card) {
  const newState = cloneState(state);
  
  // Remove from hand
  newState.hand = newState.hand.filter(c => 
    c[0] !== card[0] || c[1] !== card[1]
  );
  
  // Add to discard
  newState.discard.push(card);
  
  return newState;
}

/**
 * Get unique key for a move (for Map storage)
 * @param {*} move - Any move type
 * @returns {string} Unique key
 */
function getMoveKey(move) {
  if (typeof move === 'number') {
    return `draw-${move}`;
  }
  if (move.card && move.coord) {
    return `play-${move.card[0]}${move.card[1]}-${move.coord[0]},${move.coord[1]}`;
  }
  if (Array.isArray(move)) {
    return `discard-${move[0]}${move[1]}`;
  }
  return JSON.stringify(move);
}

module.exports = {
  mctsDrawMove,
  mctsPlayMove,
  mctsDiscardMove,
  CONFIG
};
