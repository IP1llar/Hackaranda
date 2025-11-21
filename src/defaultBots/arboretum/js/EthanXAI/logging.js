/**
 * Logging module for EthanXAI bot
 * Writes structured logs to stderr for analysis
 */

const { writeLog } = require('./logToFile.js');

const LOG_ENABLED = process.env.LOG_ENABLED !== 'false'; // Can be controlled by environment variable

/**
 * Log decision rationale for a move
 */
function logDecision(moveType, state, heuristicChoice, mctsChoice, mctsStats, usedMCTS) {
  if (!LOG_ENABLED) return;
  
  const log = {
    type: 'DECISION',
    timestamp: Date.now(),
    turn: state.turn || 0,
    subTurn: state.subTurn,
    moveType,
    heuristicChoice: formatMove(moveType, heuristicChoice),
    mctsChoice: formatMove(moveType, mctsChoice),
    mctsWinRate: mctsStats?.winRate || 0,
    confidence: mctsStats?.confidence || 0,
    usedMCTS,
    reason: usedMCTS ? `MCTS confident (${(mctsStats.confidence * 100).toFixed(1)}% gap)` : 'Fell back to heuristic'
  };
  
  writeLog(log);
}

/**
 * Log species strategy and hand composition
 */
function logSpeciesStrategy(state, ourStrategy, opponentStrategy) {
  if (!LOG_ENABLED) return;
  
  const handSums = {};
  const SPECIES = ['J', 'R', 'C', 'M', 'O', 'W'];
  
  for (const species of SPECIES) {
    handSums[species] = state.hand
      .filter(c => c[0] === species)
      .reduce((sum, c) => sum + c[1], 0);
  }
  
  const log = {
    type: 'SPECIES_STRATEGY',
    timestamp: Date.now(),
    turn: state.turn || 0,
    ourStrategy,
    opponentStrategy,
    handSums,
    handSize: state.hand.length,
    deckSize: state.deck
  };
  
  writeLog(log);
}

/**
 * Log MCTS statistics after simulation
 */
function logMCTSStats(moveType, timeBudget, timeUsed, simulationsRun, movesEvaluated, bestMove, secondBest) {
  if (!LOG_ENABLED) return;
  
  const log = {
    type: 'MCTS_STATS',
    timestamp: Date.now(),
    phase: moveType,
    timeBudget,
    timeUsed,
    simulationsRun,
    movesEvaluated,
    simulationsPerMove: simulationsRun / movesEvaluated,
    bestMove: {
      winRate: bestMove?.winRate || 0,
      trials: bestMove?.trials || 0
    },
    secondBest: {
      winRate: secondBest?.winRate || 0,
      trials: secondBest?.trials || 0
    },
    confidence: (bestMove?.winRate || 0) - (secondBest?.winRate || 0)
  };
  
  writeLog(log);
}

/**
 * Log scoring rights changes
 */
function logScoringRights(state, gained, lost, maintained, ourEvaluation, theirEvaluation) {
  if (!LOG_ENABLED) return;
  
  const log = {
    type: 'SCORING_RIGHTS',
    timestamp: Date.now(),
    turn: state.turn || 0,
    gained,
    lost,
    maintained,
    ourEvaluation,        // Evaluation score for MCTS (includes bonuses)
    theirEvaluation,      // Evaluation score for MCTS (includes bonuses)
    evaluationDiff: ourEvaluation - theirEvaluation,
    note: 'Evaluation scores include +10/species bonus and +0.5*handValue, not actual game scores'
  };
  
  writeLog(log);
}

/**
 * Log rollout prediction vs actual (only available post-game)
 */
function logRolloutAccuracy(predicted, actual) {
  if (!LOG_ENABLED) return;
  
  const log = {
    type: 'ROLLOUT_ACCURACY',
    timestamp: Date.now(),
    predicted,
    actual,
    error: Math.abs(predicted.ourScore - actual.ourScore) + Math.abs(predicted.theirScore - actual.theirScore)
  };
  
  writeLog(log);
}

/**
 * Log game summary at end
 */
function logGameSummary(finalScore, opponentScore, won) {
  if (!LOG_ENABLED) return;
  
  const log = {
    type: 'GAME_SUMMARY',
    timestamp: Date.now(),
    result: won ? 'WIN' : 'LOSS',
    ourScore: finalScore,
    opponentScore,
    scoreDiff: finalScore - opponentScore
  };
  
  writeLog(log);
}

/**
 * Log hand evaluation (what we're holding and why)
 */
function logHandEvaluation(state, cardValues) {
  if (!LOG_ENABLED) return;
  
  const handCards = state.hand.map(card => ({
    card: `${card[0]}${card[1]}`,
    value: cardValues[`${card[0]}${card[1]}`] || 0
  }));
  
  const log = {
    type: 'HAND_EVALUATION',
    timestamp: Date.now(),
    turn: state.turn || 0,
    hand: handCards,
    totalValue: handCards.reduce((sum, c) => sum + c.value, 0)
  };
  
  writeLog(log);
}

/**
 * Format move for logging
 */
function formatMove(moveType, move) {
  if (moveType === 'draw') {
    const sources = ['deck', 'own discard', 'opponent discard'];
    return sources[move] || move;
  }
  if (moveType === 'play' && move.card && move.coord) {
    return `${move.card[0]}${move.card[1]} at [${move.coord[0]},${move.coord[1]}]`;
  }
  if (moveType === 'discard' && Array.isArray(move)) {
    return `${move[0]}${move[1]}`;
  }
  return JSON.stringify(move);
}

/**
 * Log error/warning
 */
function logError(context, error) {
  const log = {
    type: 'ERROR',
    timestamp: Date.now(),
    context,
    error: error.message || error,
    stack: error.stack
  };
  
  writeLog(log);
}

/**
 * Log timing information
 */
function logTiming(operation, duration) {
  if (!LOG_ENABLED) return;
  
  const log = {
    type: 'TIMING',
    timestamp: Date.now(),
    operation,
    duration
  };
  
  writeLog(log);
}

module.exports = {
  logDecision,
  logSpeciesStrategy,
  logMCTSStats,
  logScoringRights,
  logRolloutAccuracy,
  logGameSummary,
  logHandEvaluation,
  logError,
  logTiming
};
