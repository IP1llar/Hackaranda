/**
 * Simulation module for MCTS
 * Handles state determinization, rollouts, and game state manipulation
 */

const { approximateScore } = require('./scoring.js');
const { pickRandomFromArray, getAllEmptyAdjacentSpaces } = require('./helpers.js');

const ALL_CARDS = [];
const SPECIES = ['J', 'R', 'C', 'M', 'O', 'W'];
// Initialize all 80 cards (6 species * 8 ranks, plus 4 rank-1 cards)
for (const species of SPECIES) {
  for (let rank = 1; rank <= 8; rank++) {
    ALL_CARDS.push([species, rank]);
    if (rank === 1) {
      ALL_CARDS.push([species, 1]); // Extra 1s
    }
  }
}

/**
 * Get all cards that haven't been seen yet
 * @param {Object} state - Current game state
 * @returns {Array} Array of unseen cards
 */
function getUnseenCards(state) {
  const seen = new Set();
  
  // Add visible cards to seen set
  const addCards = (cards) => {
    for (const card of cards) {
      if (card) {
        seen.add(`${card[0]}-${card[1]}`);
      }
    }
  };
  
  addCards(state.hand);
  addCards(state.discard);
  addCards(state.opponentDiscard);
  
  // Add cards from both play areas
  for (const x in state.playArea) {
    for (const y in state.playArea[x]) {
      addCards([state.playArea[x][y]]);
    }
  }
  
  for (const x in state.opponentPlayArea) {
    for (const y in state.opponentPlayArea[x]) {
      addCards([state.opponentPlayArea[x][y]]);
    }
  }
  
  // Add known opponent cards
  if (state.opponentHand) {
    addCards(state.opponentHand);
  }
  
  // Return unseen cards
  const unseen = [];
  for (const card of ALL_CARDS) {
    const key = `${card[0]}-${card[1]}`;
    if (!seen.has(key)) {
      unseen.push(card);
    }
  }
  
  return unseen;
}

/**
 * Determinize opponent's hand
 * @param {Object} state - Current game state
 * @returns {Array} Sampled opponent hand
 */
function determinizeOpponentHand(state) {
  const unseenCards = getUnseenCards(state);
  const handSize = state.opponentHand ? state.opponentHand.length : 7;
  
  // Early game: uniform random sampling
  if (state.deck > 15) {
    return sampleCards(unseenCards, handSize);
  }
  
  // Late game: constrained sampling using visible information
  // For simplicity, still sample randomly but prefer cards that make sense
  // (In full implementation, this would use more sophisticated inference)
  return sampleCards(unseenCards, handSize);
}

/**
 * Sample N cards randomly from array
 * @param {Array} cards - Available cards
 * @param {number} n - Number to sample
 * @returns {Array} Sampled cards
 */
function sampleCards(cards, n) {
  if (cards.length <= n) {
    return [...cards];
  }
  
  const sampled = [];
  const available = [...cards];
  
  for (let i = 0; i < n && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    sampled.push(available[idx]);
    available.splice(idx, 1);
  }
  
  return sampled;
}

/**
 * Fast rollout: simulate game to end using lightweight heuristics
 * @param {Object} state - Current game state
 * @param {number} maxDepth - Maximum moves to simulate
 * @param {number} timeLimit - Time limit in ms
 * @returns {Object} {ourScore, theirScore}
 */
function fastRollout(state, maxDepth = 10, timeLimit = 15) {
  const startTime = Date.now();
  let currentState = cloneState(state);
  let movesSimulated = 0;
  
  // Simulate until game ends or limits reached
  while (movesSimulated < maxDepth && Date.now() - startTime < timeLimit) {
    // Check if game is over (deck empty and hands empty after discards)
    if (isGameOver(currentState)) {
      break;
    }
    
    // Simulate one full turn (draw, draw, play, discard)
    currentState = simulateTurn(currentState);
    movesSimulated++;
  }
  
  // Calculate final scores
  const ourScore = approximateScore(
    currentState.playArea,
    currentState.hand,
    currentState.opponentHand
  );
  
  const theirScore = approximateScore(
    currentState.opponentPlayArea,
    currentState.opponentHand,
    currentState.hand
  );
  
  return { ourScore, theirScore };
}

/**
 * Simulate one complete turn using lightweight heuristics
 * @param {Object} state - Current state
 * @returns {Object} New state after turn
 */
function simulateTurn(state) {
  let newState = cloneState(state);
  
  // Draw phase (2 draws)
  for (let i = 0; i < 2; i++) {
    newState = simulateDrawMove(newState);
  }
  
  // Play phase
  newState = simulatePlayMove(newState);
  
  // Discard phase
  newState = simulateDiscardMove(newState);
  
  // Switch active player
  newState = switchPlayer(newState);
  
  return newState;
}

/**
 * Simulate a draw move (lightweight heuristic)
 * @param {Object} state - Current state
 * @returns {Object} New state
 */
function simulateDrawMove(state) {
  // Simple: prefer deck, then random discard
  if (state.deck > 0) {
    return drawFromDeck(state);
  }
  
  if (state.discard.length > 0 && Math.random() < 0.5) {
    return drawFromDiscard(state, 1);
  }
  
  if (state.opponentDiscard.length > 0) {
    return drawFromDiscard(state, 2);
  }
  
  return state;
}

/**
 * Simulate a play move (lightweight heuristic)
 * Prefer playing LOW-rank cards to keep high cards in hand
 * @param {Object} state - Current state
 * @returns {Object} New state
 */
function simulatePlayMove(state) {
  if (state.hand.length === 0) return state;
  
  // Sort hand by rank, prefer playing LOW-rank cards
  const sortedHand = [...state.hand].sort((a, b) => a[1] - b[1]);
  const card = sortedHand[0]; // Pick lowest rank
  
  // Find valid position
  const emptySpaces = getAllEmptyAdjacentSpaces(state.playArea);
  if (emptySpaces.length === 0) return state;
  
  const coord = pickRandomFromArray(emptySpaces);
  
  // Apply play
  const newState = cloneState(state);
  newState.hand = newState.hand.filter(c => c[0] !== card[0] || c[1] !== card[1]);
  
  if (!newState.playArea[coord[0]]) {
    newState.playArea[coord[0]] = {};
  }
  newState.playArea[coord[0]][coord[1]] = card;
  
  return newState;
}

/**
 * Simulate a discard move (lightweight heuristic)
 * @param {Object} state - Current state
 * @returns {Object} New state
 */
function simulateDiscardMove(state) {
  if (state.hand.length === 0) return state;
  
  // Discard lowest rank card
  let lowestCard = state.hand[0];
  for (const card of state.hand) {
    if (card[1] < lowestCard[1]) {
      lowestCard = card;
    }
  }
  
  const newState = cloneState(state);
  newState.hand = newState.hand.filter(c => c[0] !== lowestCard[0] || c[1] !== lowestCard[1]);
  newState.discard.push(lowestCard);
  
  return newState;
}

/**
 * Clone game state (shallow copy sufficient for our needs)
 * @param {Object} state - State to clone
 * @returns {Object} Cloned state
 */
function cloneState(state) {
  return {
    ...state,
    hand: [...state.hand],
    opponentHand: state.opponentHand ? [...state.opponentHand] : [],
    discard: [...state.discard],
    opponentDiscard: [...state.opponentDiscard],
    playArea: JSON.parse(JSON.stringify(state.playArea)),
    opponentPlayArea: JSON.parse(JSON.stringify(state.opponentPlayArea))
  };
}

/**
 * Check if game is over
 * @param {Object} state - Current state
 * @returns {boolean} True if game is over
 */
function isGameOver(state) {
  return state.deck === 0 && state.hand.length === 0 && state.opponentHand.length === 0;
}

/**
 * Draw from deck
 * @param {Object} state - Current state
 * @returns {Object} New state
 */
function drawFromDeck(state) {
  const newState = cloneState(state);
  const unseenCards = getUnseenCards(state);
  
  if (unseenCards.length > 0) {
    const drawnCard = pickRandomFromArray(unseenCards);
    newState.hand.push(drawnCard);
    newState.deck--;
  }
  
  return newState;
}

/**
 * Draw from discard pile
 * @param {Object} state - Current state
 * @param {number} pile - 1 for own, 2 for opponent
 * @returns {Object} New state
 */
function drawFromDiscard(state, pile) {
  const newState = cloneState(state);
  
  if (pile === 1 && newState.discard.length > 0) {
    const card = newState.discard.pop();
    newState.hand.push(card);
  } else if (pile === 2 && newState.opponentDiscard.length > 0) {
    const card = newState.opponentDiscard.pop();
    newState.hand.push(card);
  }
  
  return newState;
}

/**
 * Switch active player (simplified - swaps perspectives)
 * @param {Object} state - Current state
 * @returns {Object} New state
 */
function switchPlayer(state) {
  const newState = cloneState(state);
  
  // Swap hands
  [newState.hand, newState.opponentHand] = [newState.opponentHand, newState.hand];
  
  // Swap play areas
  [newState.playArea, newState.opponentPlayArea] = [newState.opponentPlayArea, newState.playArea];
  
  // Swap discards
  [newState.discard, newState.opponentDiscard] = [newState.opponentDiscard, newState.discard];
  
  return newState;
}

module.exports = {
  getUnseenCards,
  determinizeOpponentHand,
  fastRollout,
  cloneState,
  isGameOver
};
